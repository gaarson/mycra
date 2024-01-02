process.env.NODE_ENV = 'development';

import esbuild from 'esbuild';
import http from 'node:http';
import url from 'node:url';
import fs from 'node:fs';
import fsExtra from 'fs-extra'
import path from 'path';

import chokidar from 'chokidar';

import svgr from 'esbuild-plugin-svgr';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import envFilePlugin from 'esbuild-envfile-plugin';

import stylePlugin from 'esbuild-style-plugin'

import args from '../utils/args.js';
import dir from '../config/paths.js';

import { styleNamePlugin } from '../styleName-plugin/index.js';

const MIME_FILES_MAP = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword'
};

const checkFileExists = (filePath) => {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) resolve(false);
      else resolve(true);
    });
  });
}

const startWatching = (directoryPath, addCb, rmCb) => {
  var watcher = chokidar.watch(directoryPath, { ignored: /^\./, persistent: true });

  watcher
    .on('add', (path) => {
      addCb(path.replace(directoryPath, ''))
      // console.log('File', path, 'has been added');
    })
    // .on('change', (path) => {
    //   console.log('File', path, 'has been changed');
    // })
    .on('unlink', (path) => {
      rmCb(path.replace(directoryPath, ''));
    })
    .on('error', (error) => {
      console.error('Error happened', error);
    })

}

const sendFile = (pathname, res) => {
  const ext = path.parse(pathname).ext;

  fs.exists(pathname, function (exist) {
    if(!exist) {
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }

    if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

    fs.readFile(pathname, function(err, data){
      if(err){
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        res.setHeader('Content-type', MIME_FILES_MAP[ext] || 'text/plain' );
        res.end(data);
      }
    });
  });
};

const getHTMLTemplate = (pathname) => {
  return new Promise((resolve, reject) => {
    fs.exists(pathname, function (exist) {
      if(!exist) {
        // if the file is not found, return 404
        console.error('File doesn`t exists');
        reject();
      }

      // if is a directory search for index file matching the extension
      if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

      // read file from file system
      fs.readFile(pathname, 'utf8', function(err, data){
        if(err){
          console.error('ERROR: ', err);
        } else {
          // console.log('DATA', data);
          resolve(data);
          // if the file is found, set Content-type and send data
        }
      });
    });
  })
};

(async () => {
  if (fsExtra.existsSync(dir.dist)) {
    // Remove the directory
    fsExtra.removeSync(dir.dist);
    console.log(`Directory "${dir.dist}" removed successfully.`);
  } else {
    console.error(`Directory "${dir.dist}" does not exist.`);
  }
  const htmlFilePath = `${dir.public}/index.html`;
  const rawHTML = await getHTMLTemplate(htmlFilePath);
  let html = rawHTML;

  let ctx = await esbuild.context({
    entryPoints: [`${dir.app}/index.tsx`],
    bundle: true,
    outdir: dir.dist,
    define: {'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')},
    assetNames: 'assets/[name]-[hash]',
    chunkNames: 'chunks/[name]-[hash]',
    entryNames: '[name]-[hash]',
    // write: true,
    allowOverwrite: true,
    sourcemap: true,
    treeShaking: true,
    metafile: true,
    absWorkingDir: dir.root,
    plugins: [
      stylePlugin({
        cssModulesMatch: /\.s?[ca]ss$/,
        cssModulesOptions: {
          generateScopedName: function (name, filename, css) {
            var i = css.indexOf("." + name);
            var line = css.substr(0, i).split(/[\r\n]/).length;
            var file = path.basename(filename, ".css");

            return "_" + file + "_" + line + "_" + name;
          },
        }
      }),
      styleNamePlugin(function (name, filename, css) {
        var i = css.indexOf("." + name);
        var line = css.substr(0, i).split(/[\r\n]/).length;
        var file = path.basename(filename, ".css");

        return "_" + file + "_" + line + "_" + name;
      }),
      svgr(),
      envFilePlugin,
      // nodeExternalsPlugin()
    ],
    jsx: 'automatic',
    alias: {
      'app': dir.app,
    },
    loader: {
      '.png': 'dataurl',
      '.woff': 'dataurl',
      '.woff2': 'dataurl',
      '.eot': 'dataurl',
      '.ttf': 'dataurl',
      '.svg': 'dataurl',
    },
  })

  // The return value tells us where esbuild's local server is
  await ctx.watch()

  let scripts = [];
  let styles = [];

  const redrawHTML = () => {
    let newHTML = rawHTML.replace('<!--[styles]-->', styles.reduce((stylesStr, styleSrc) => {
      return stylesStr + `<link rel="stylesheet" type="text/css" href="${styleSrc}">\n`
    }, ''))
    html = newHTML.replace('<!--[scripts]-->', scripts.reduce((scriptStr, scriptSrc) => {
      return scriptStr + `<script src="${scriptSrc}"></script>\n`
    }, `<script>new EventSource('/esbuild').addEventListener('change', () => location.reload())</script>\n`))
  }

  startWatching(dir.dist, (changedFile) => {
    if (path.extname(changedFile) === '.js') scripts = [...scripts, changedFile];
    if (path.extname(changedFile) === '.css') styles = [...styles, changedFile];
    redrawHTML();
  }, (removedFile) => {
    if (path.extname(removedFile) === '.js') scripts = scripts.filter(i => i !== removedFile);
    if (path.extname(removedFile) === '.css') styles = styles.filter(i => i !== removedFile);
    redrawHTML();
  });

  let { host, port } = await ctx.serve({ servedir: dir.dist })

  http.createServer(async (req, res) => {
    const options = {
      hostname: host,
      port: port,
      path: req.url,
      method: req.method,
      headers: req.headers,
    }
    const parsedUrl = url.parse(req.url);
    const publicPathName = `${dir.public}${parsedUrl.pathname}`;
    const distPathName = `${dir.dist}${parsedUrl.pathname}`

    const newHTMLFilePath = `${dir.dist}/index.html`

    if (parsedUrl.pathname === '/') {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(html);
      res.end();
    } else if (parsedUrl.pathname === '/esbuild') { // hot-reload
      const proxyReq = http.request(options, proxyRes => {
        if (proxyRes.statusCode === 404) {
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write(html);
          res.end();
          return 
        }

        res.writeHead(proxyRes.statusCode, proxyRes.headers)
        proxyRes.pipe(res, { end: true })
      });

      req.pipe(proxyReq, { end: true });
    } else if (MIME_FILES_MAP[path.extname(parsedUrl.pathname)]) {
      if (await checkFileExists(publicPathName)) {
        sendFile(publicPathName, res);
      } else if (await checkFileExists(distPathName)) {
        sendFile(distPathName, res);
      } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end(undefined)
      }
    } else {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(html);
      res.end();
    }

  }).listen(3000)
})();
