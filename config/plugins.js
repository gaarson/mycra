import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url'
import envFilePlugin from 'esbuild-envfile-plugin';
import stylePlugin from 'esbuild-style-plugin'
import { environmentPlugin } from 'esbuild-plugin-environment';

import babel from 'esbuild-plugin-babel';
import { dtsPlugin } from "esbuild-plugin-d.ts";
import { polyfillNode } from "esbuild-plugin-polyfill-node";
import { styleNamePlugin } from '../esbuild-module-style-name-plugin/index.js';
import { stylePerPlugin } from '../esbuild-style-plugin/index.js';
import buildMode from './buildMode.js';
import { mySvg } from '../esbuild-svg-plugin/index.js';

import dir from './paths.js';
import args from '../utils/args.js';
import progress from 'esbuild-plugin-progress';
import time from 'esbuild-plugin-time';

let babelConfig;

export const getPlugins = async (scopeGenerator) => { 
  if (args.babel) {
    const res = await import(path.join(dir.root, args.babel));
    babelConfig = res.default;
  }

  let plugins = [
    styleNamePlugin(scopeGenerator || buildMode.simpleClassHash),
    ...(babelConfig ? [
      babel({
        filter: /\.js(x?)$/,
        namespace: '',
        config: babelConfig
      })
    ] : []),
    // progress(),
    time(),
    stylePerPlugin({
      renderOptions: {
        sassOptions: {
          // importers: [{
          //   findFileUrl(url, ...rest) {
          //     if (url.startsWith('@'))  {
          //       const resultUrl = new URL(pathToFileURL(path.join(dir.app, url.replace('@', ''))));
          //       return resultUrl;
          //     }
          //     return url;
          //   }
          // }],
        }
      },
      cssModulesOptions: {
        generateScopedName: scopeGenerator || buildMode.simpleClassHash,
      }
    }),
    mySvg(dir.app, dir.dist, args.splitSvg),
    polyfillNode(),
    envFilePlugin,
  ]

  if (args.generateDts) {
    plugins = [
      ...plugins,
      dtsPlugin()
    ]
  }

  return plugins;
}
