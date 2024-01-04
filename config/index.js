import fs from 'fs';
import fsExtra from 'fs-extra';
import path from 'path';

import args from '../utils/args.js';
import dir from './paths.js';

import buildMode from './buildMode.js';
import { getPlugins } from './plugins.js';
import { APP_ENV_KEY } from '../constants.js';

import dotenv from 'dotenv'
dotenv.config({ path: dir.env });

const devtoolDev = 'eval-cheap-source-map';
let devtool;
if (args['source-map']) {
  devtool = 'inline-source-map';
} else {
  devtool = buildMode.isDevelop() ? devtoolDev : undefined;
}

const baseFileName = buildMode.isDevelop() || buildMode.isTest() 
  ? '[name]' 
  : '[name].[hash:8]';

const includeModules = args.includeModules ? args.includeModules.split(',').reduce((prev, curr) => {
  return {
    ...prev,
    [curr]: `${dir.root}/${curr}`
  };
}, {}) : null;

const grabComponentsDirecrories = (src, ext) => {
  const list = fs.readdirSync(src);
  let result = [];


  for (const name of list) {
    if (
      !fs.lstatSync(`${src}/${name}`, { withFileTypes: true }).isDirectory() && 
      ext.test(path.extname(name))
    ) {
      result = [...result, `${src}/${name}`];
    } 
  }

  return result;
};

let entry;

if (fsExtra.existsSync(`${dir.app}/index.tsx`)) {
  entry = [`${dir.app}/index.tsx`];
} else {
  entry = grabComponentsDirecrories(dir.app, /\.[jt]sx?$/);
}
const env = Object.keys(process.env)
  .filter((key) => key.startsWith(APP_ENV_KEY))
  .reduce((acc, curr) => ({ 
    ...acc, 
    [curr.replace(APP_ENV_KEY, '')]: process.env[curr] || '',
  }), { buildMode: buildMode.type })

export const getConfig = () => ({
    entryPoints: entry,
    bundle: true,
    outdir: dir.dist,
    platform: 'browser',
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'glob': `{ "env": ${JSON.stringify(env)} }`,
    },
    assetNames: `assets/${baseFileName}`,
    chunkNames: `${baseFileName}.chunk`,
    entryNames: `${baseFileName}`,
    // write: true,
    jsxSideEffects: true,
    allowOverwrite: true,
    // format: 'esm',
    sourcemap: 'both',
    treeShaking: true,
    metafile: true,
    absWorkingDir: dir.root,
    nodePaths: includeModules ? Object.values(includeModules) : undefined,
    // external: includeModules ? Object.values(includeModules) : undefined,
    plugins: getPlugins(buildMode.simpleClassHash),
    jsx: 'transform',
    alias: {
      'src': dir.app,
      '@': dir.app,
      ...(includeModules ? includeModules : {})
    },
    loader: {
      '.png': 'dataurl',
      '.eot': 'dataurl',
      '.ttf': 'dataurl',
      '.svg': 'dataurl',
      '.gif': 'dataurl',
      '.woff': 'dataurl',
      '.woff2': 'dataurl',
    },
})
