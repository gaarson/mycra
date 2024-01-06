process.env.NODE_ENV = 'development';

import esbuild from 'esbuild';
import http from 'node:http';
import url from 'node:url';
import fs from 'node:fs';
import fsExtra from 'fs-extra'
import path from 'path';

import sizeLimit from 'size-limit';
import filePlugin from '@size-limit/file';

import sizeLimitEsbuild from '@size-limit/esbuild';

import { glob } from 'glob';
import chokidar from 'chokidar';

import args from '../utils/args.js';
import dir from '../config/paths.js';

import { getConfig } from '../config/index.js';

import { MIME_FILES_MAP, DEFAULT_PORT, DEFAULT_HOST } from '../constants.js';

const HOST = process.env.HOST || DEFAULT_HOST;
const PORT = process.env.PORT || DEFAULT_PORT;

const updateFileList = async (directoryToWatch) => {
  const res = await glob(directoryToWatch + '/**/*', { nodir: true });
  return res;
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
    })
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
        console.error('File doesn`t exists');
        reject();
      }

      if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

      fs.readFile(pathname, 'utf8', function(err, data){
        if(err){
          console.error('ERROR: ', err);
        } else {
          resolve(data);
        }
      });
    });
  })
};

(async () => {
  if (fsExtra.existsSync(dir.dist)) {
    fsExtra.removeSync(dir.dist);
    console.log(`Directory "${dir.dist}" removed successfully.`);
  } else {
    console.error(`Directory "${dir.dist}" does not exist.`);
  }
  const htmlFilePath = `${dir.public}/${args.template}`;
  const rawHTML = await getHTMLTemplate(htmlFilePath);
  const publicFiles = await updateFileList(dir.public);
  let html = rawHTML;

  let ctx = await esbuild.context(getConfig())

  await ctx.watch()
  
  let scripts = [];
  let styles = [];

  const redrawHTML = async () => {
    let newHTML = rawHTML.replace('<!--[styles]-->', styles.reduce((stylesStr, styleSrc) => {
      return stylesStr + `<link rel="stylesheet" type="text/css" href="${styleSrc}">\n`
    }, ''))
    html = newHTML.replace('<!--[scripts]-->', scripts.reduce((scriptStr, scriptSrc) => {
      return scriptStr + `<script type="module" src="${scriptSrc}"></script>\n`
    }, `<script>new EventSource('/esbuild').addEventListener('change', () => location.reload())</script>\n`))

    if (args.size) {
      const distFiles = (await updateFileList(dir.dist))
      .filter(s => {
        console.log('AAAAAA', s, publicFiles.some(f => path.basename(f) === path.basename(s)));
        return path.extname(s) === '.js' && !publicFiles.some(f => path.basename(f) === path.basename(s));
      })
      console.log('DIST', distFiles);
      sizeLimit([filePlugin, sizeLimitEsbuild], distFiles).then(result => {
        console.log(distFiles, result);
      })
    }

    if (!args.devServer) {
      for (const publcFilePath of publicFiles) {
        if (path.basename(publcFilePath) !== args.template) {
          fsExtra.copySync(publcFilePath, `${dir.dist}/${path.basename(publcFilePath)}`);
        }
      }
      fs.writeFile(
        `${dir.dist}/${args.template}`, 
        html, 
        (err) => {
          if (err) {
            console.error('Error writing HTML file:', err);
          }
        }
      );
    }
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

  if (args.devServer) {
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

      const newHTMLFilePath = `${dir.dist}/${args.template}`

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

    }).listen(PORT, HOST)
  }

})();
