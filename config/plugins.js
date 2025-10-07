import path from 'path';
import envFilePlugin from 'esbuild-envfile-plugin';

import babel from 'esbuild-plugin-babel';
import { dtsPlugin } from "esbuild-plugin-d.ts";
import { polyfillNode } from "esbuild-plugin-polyfill-node";
import { styleMagicPlugin } from '../esbuild-style-magic-plugin/index.js'; // Импортируем наш новый плагин

import buildMode from './buildMode.js';
import { mySvg } from '../esbuild-svg-plugin/index.js';

import dir from './paths.js';
import args from '../utils/args.js';
import time from 'esbuild-plugin-time';

let babelConfig;

export const getPlugins = async (scopeGenerator) => { 
  if (args.babel) {
    const res = await import(path.join(dir.root, args.babel));
    babelConfig = res.default;
  }
  const sharedState = { modulesMap: {} };
    
  let plugins = [
    styleMagicPlugin({
      cssModulesOptions: {
        generateScopedName: scopeGenerator || buildMode.simpleClassHash,
      }
    }), 
    ...(babelConfig ? [
      babel({
        filter: /\.js(x?)$/,
        namespace: '',
        config: babelConfig
      })
    ] : []),
    time(),
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
