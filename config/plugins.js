import fs from 'fs';
import path from 'path';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import svgr from 'esbuild-plugin-svgr';
import envFilePlugin from 'esbuild-envfile-plugin';
import stylePlugin from 'esbuild-style-plugin'
import { environmentPlugin } from 'esbuild-plugin-environment';

import { polyfillNode } from "esbuild-plugin-polyfill-node";
import { styleNamePlugin } from '../esbuild-module-style-name-plugin/index.js';
import buildMode from './buildMode.js';
import { mySvg } from '../esbuild-my-svg-plugin/index.js';

import dir from './paths.js';
import args from '../utils/args.js';

const getCSSTemplate = (pathname) => {
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
      fs.readFileSync(pathname, 'utf8', function(err, data){
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

export const getPlugins = (scopeGenerator) => ([
  stylePlugin({
    cssModulesMatch: /\.s?css$/,
    renderOptions: {
      sassOptions: {
        importer: (url, prev) => {
          if (url.startsWith('@/')) {
            return { file: path.join(dir.app, url.replace('@', '')) };
          };
        } 
      }
    },
    cssModulesOptions: {
      generateScopedName: scopeGenerator || buildMode.simpleClassHash,
    }
  }),
  styleNamePlugin(scopeGenerator || buildMode.simpleClassHash),
  mySvg(dir.app, dir.dist, args.splitSvg),
  // environmentPlugin({
  //   glob: {
  //     VAL: 'AA'
  //   },
  // })
  polyfillNode(),
  envFilePlugin,
  // nodeExternalsPlugin()
])
