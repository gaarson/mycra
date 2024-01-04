process.env.NODE_ENV = 'production';

import path from 'path';
import fs from 'node:fs';
import fsExtra from 'fs-extra'
import url from 'node:url';

import esbuild from 'esbuild';

import dir from '../config/paths.js';

import { getConfig } from '../config/index.js';

if (fsExtra.existsSync(dir.dist)) {
  // Remove the directory
  fsExtra.removeSync(dir.dist);
  console.log(`Directory "${dir.dist}" removed successfully.`);
} else {
  console.error(`Directory "${dir.dist}" does not exist.`);
}

esbuild.build(getConfig()).catch((error) => {
  console.log('Error', error);
  process.exit(1)
})
// const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
// console.log(import.meta.url);

// fs.writeFileSync(path.join(__dirname, 'meta.json'), JSON.stringify(result.metafile))
