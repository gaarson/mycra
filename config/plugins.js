import fs from 'fs';
import path from 'path';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import svgr from 'esbuild-plugin-svgr';
import envFilePlugin from 'esbuild-envfile-plugin';
import stylePlugin from 'esbuild-style-plugin'
import { environmentPlugin } from 'esbuild-plugin-environment';

import { dtsPlugin } from "esbuild-plugin-d.ts";
import { polyfillNode } from "esbuild-plugin-polyfill-node";
import { styleNamePlugin } from '../esbuild-module-style-name-plugin/index.js';
import buildMode from './buildMode.js';
import { mySvg } from '../esbuild-my-svg-plugin/index.js';

import dir from './paths.js';
import args from '../utils/args.js';

export const getPlugins = (scopeGenerator) => { 
  let plugins = [
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
    polyfillNode(),
    envFilePlugin,
  ]

  if (args.generateDts) {
    plugins = [
      ...plugins,
      dtsPlugin()
    ]
  }

  if (args.excludeModules) {
    plugins = [
      ...plugins,
      nodeExternalsPlugin()
    ]
  }

  if (args.allowModules) {
    plugins = [
      ...plugins,
      nodeExternalsPlugin({
        allowList: args.allowModules.split(',')
      })
    ]
  }

  return plugins;
}
