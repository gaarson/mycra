process.env.NODE_ENV = 'development';

import esbuild from 'esbuild';
import http from 'node:http';
import url from 'url';
import fs from 'node:fs';
import fsExtra from 'fs-extra'
import path from 'path';

import sizeLimit from 'size-limit';
import filePlugin from '@size-limit/file';

import sizeLimitEsbuild from '@size-limit/esbuild';

import { glob } from 'glob';
import chokidar from 'chokidar';

import dir from '../config/paths.js';

import args from '../utils/args.js';
import { fillTemplate, getHTMLTemplate } from '../utils/html-template.js';

import { getConfig, entryFiles } from '../config/index.js';

import { MIME_FILES_MAP, DEFAULT_PORT, DEFAULT_HOST } from '../constants.js';

const HOST = process.env.HOST || DEFAULT_HOST;
const PORT = process.env.PORT || DEFAULT_PORT;

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

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


(async () => {
  try {
    if (
      fsExtra.existsSync(dir.dist) && 
      path.dirname(dir.dist) !== path.dirname(dir.root)
    ) {
      fsExtra.removeSync(dir.dist);
      console.log(`Directory "${dir.dist}" removed successfully.`);
    } else {
      if (path.dirname(dir.dist) === path.dirname(dir.root)) {
        console.error(`Directory dist and root same.`);
      } else {
        console.error(`Directory "${dir.dist}" does not exist.`);
      }
    }

    const htmlFilePath = `${dir.public}/${args.template}`;
    const rawHTML = await getHTMLTemplate(htmlFilePath);
    const publicFiles = await updateFileList(dir.public);
    let html = rawHTML;

    let ctx = await esbuild.context(getConfig())

    await ctx.watch()
    
    let scripts = [];
    let styles = [];

    const writeFiles = () => {
      if (!args.devServer) {
        for (const publcFilePath of publicFiles) {
          if (path.basename(publcFilePath) !== args.template) {
            fsExtra.copySync(publcFilePath, `${dir.dist}/${path.basename(publcFilePath)}`);
          }
        }
        if (html) {
          fs.writeFileSync(`${dir.dist}/${args.template}`, html);
        }
      }
    };
    
    startWatching(dir.dist, (changedFile) => {
      entryFiles.forEach(entry => {
        if (
          path.extname(changedFile) === '.js' && 
          (path.basename(entry).split('.')[0] === path.basename(changedFile).split('.')[0] ||
          path.basename(changedFile).split('.')[0] === 'svg-insert')
        ) {
          scripts = [...scripts, changedFile];
        }
      })
      if (path.extname(changedFile) === '.css') styles = [...styles, changedFile];
      html = fillTemplate(rawHTML, scripts, styles);
      writeFiles();
    }, (removedFile) => {
      if (path.extname(removedFile) === '.js') scripts = scripts.filter(i => i !== removedFile);
      if (path.extname(removedFile) === '.css') styles = styles.filter(i => i !== removedFile);
      html = fillTemplate(rawHTML, scripts, styles);
      writeFiles();
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

      }).listen(PORT, HOST);
    }

    if (args.size) {
      const distFiles = (await updateFileList(dir.dist)).filter(
        s => path.extname(s) === '.js' && !publicFiles.some(f => path.basename(f) === path.basename(s))
      );

      sizeLimit([filePlugin, sizeLimitEsbuild], distFiles).then(result => {
        console.log(distFiles, result);
      })
    }
  } catch (error) {
    console.error('ERRRRRRRRRRRRRRE', error);
  }
})();
