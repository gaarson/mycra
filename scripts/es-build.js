process.env.NODE_ENV = 'production';

import path from 'path';
import fs from 'node:fs';
import url from 'node:url';

import args from '../utils/args.js';
import dir from '../config/paths.js';
import { sassPlugin } from 'esbuild-sass-plugin';
import svgr from 'esbuild-plugin-svgr';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import envFilePlugin from 'esbuild-envfile-plugin';
import { htmlPlugin as HTMLPlugin } from '@craftamap/esbuild-plugin-html';
import html from '@xbuildr/html/index.js'

import esbuild from 'esbuild';

const htmlFilePath = `${dir.public}/index.html`;

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
          console.log('DATA', data);
          resolve(data);
          // if the file is found, set Content-type and send data
        }
      });
    });
  })
};

esbuild.build({
  entryPoints: [`${dir.app}/index.tsx`],
  bundle: true,
  metafile: true,
  outdir: dir.dist,
  // define: {'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')},
  plugins: [
    // sassPlugin({ cssImports: true }),
    // svgr(),
    // envFilePlugin,
    // HTMLPlugin({ 
    //   files: [
    //     {
    //       entryPoints: [`${dir.app}/index.tsx`],
    //       filename: 'index.html',
    //       scriptLoading: 'module',
    //       // htmlTemplate: await getHTMLTemplate(htmlFilePath),
    //     },
    // ]}),
    // nodeExternalsPlugin()
    html()
  ],
  assetNames: '[name]',
  jsx: 'automatic',
  loader: {
    '.png': 'dataurl',
    '.woff': 'dataurl',
    '.woff2': 'dataurl',
    '.ttf': 'dataurl',
    '.svg': 'dataurl',
  },
}).catch((error) => {
  console.log('Error', error);
  process.exit(1)
})
// const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
// console.log(import.meta.url);

// fs.writeFileSync(path.join(__dirname, 'meta.json'), JSON.stringify(result.metafile))
