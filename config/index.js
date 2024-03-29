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

const baseFileName = '[name].[hash]';

const includeModules = args.includeModules ? args.includeModules.split(',').reduce((prev, curr) => {
  if (curr.indexOf(':') !== -1) {
    const [module, modulePath] = curr.split(':');
    return {
      ...prev,
      [module]: path.join(dir.root, modulePath)
    };
  } else {
    return {
      ...prev,
      [curr]: `${dir.root}/${curr}`
    };
  }
}, {}) : null;

const grabComponentsDirecrories = (src, ext) => {
  const list = fs.readdirSync(src);
  let result = [];

  for (const name of list) {
    const isDirectory = fs.lstatSync(`${src}/${name}`, { withFileTypes: true }).isDirectory();
    if (!isDirectory && ext.test(path.extname(name))) {
      result = [...result, `${src}/${name}`];
    } 
    if (isDirectory && fsExtra.existsSync(`${src}/${name}/index.js`)) {
      result = [...result, `${src}/${name}/index.js`];
    }
    if (isDirectory && fsExtra.existsSync(`${src}/${name}/index.jsx`)) {
      result = [...result, `${src}/${name}/index.jsx`];
    }
    if (isDirectory && fsExtra.existsSync(`${src}/${name}/index.ts`)) {
      result = [...result, `${src}/${name}/index.ts`];
    }
    if (isDirectory && fsExtra.existsSync(`${src}/${name}/index.tsx`)) {
      result = [...result, `${src}/${name}/index.tsx`];
    }
  }

  return result;
};

let entry;

if (fsExtra.existsSync(`${dir.app}/index.js`)) {
  entry = [`${dir.app}/index.js`];
} else if (fsExtra.existsSync(`${dir.app}/index.jsx`)) {
  entry = [`${dir.app}/index.jsx`];
} else if (fsExtra.existsSync(`${dir.app}/index.ts`)) {
  entry = [`${dir.app}/index.ts`];
} else if (fsExtra.existsSync(`${dir.app}/index.tsx`)) {
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

let bundleSettings = {
  bundle: true,
  splitting: args.format === 'esm' ? true : false,
  format: args.format,
  alias: {
    'src': dir.app,
    '@': dir.app,
    ...(includeModules ? includeModules : {})
  },
}

export const entryFiles = entry;
export const getConfig = async () => { 
  const plugins = await getPlugins(buildMode.simpleClassHash);

  return {
    ...bundleSettings,
    entryPoints: entry,
    outdir: dir.dist,
    platform: args.platform,
    drop: buildMode.type === 'production' ? ['console'] : [],
    define: {
      'process.env.NODE_ENV': JSON.stringify(buildMode.type),
      'glob': `{ "env": ${JSON.stringify(env)} }`,
      'global': 'window',
    },
    assetNames: `assets/${baseFileName}`,
    chunkNames: entry.length > 1 ? `chunks/[hash].[name]` : baseFileName,
    entryNames: entry.length > 1 ? `[dir]/[name]` : baseFileName,
    allowOverwrite: args.allowOverwrite,
    minify: buildMode.type === 'production' ? true : false,
    sourcemap: buildMode.type === 'production' ? false : 'both',
    treeShaking: buildMode.type === 'production' ? true : false,
    metafile: true,
    absWorkingDir: dir.root,
    nodePaths: includeModules 
      ? Object.values(includeModules) 
      : undefined,
    packages: args.excludeModules ? 'external' : undefined,
    plugins,
    jsx: 'transform',
    loader: {
      '.png': 'dataurl',
      '.eot': 'dataurl',
      '.ttf': 'dataurl',
      '.svg': 'dataurl',
      '.gif': 'dataurl',
      '.woff': 'dataurl',
      '.woff2': 'dataurl',
    },
  } 
}
