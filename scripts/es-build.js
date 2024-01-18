process.env.NODE_ENV = 'production';
import esbuild from 'esbuild';

import path from 'path';
import fs from 'node:fs';
import fsExtra from 'fs-extra'
import url from 'url';

import chokidar from 'chokidar';
import { glob } from 'glob';
import sizeLimit from 'size-limit';
import filePlugin from '@size-limit/file';
import sizeLimitEsbuild from '@size-limit/esbuild';
import sizeLimitEsbuildWhy from '@size-limit/esbuild-why';

import args from '../utils/args.js';
import { fillTemplate, getHTMLTemplate } from '../utils/html-template.js';

import dir from '../config/paths.js';

import { getConfig, entryFiles } from '../config/index.js';

import { MIME_FILES_MAP } from '../constants.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

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
    const updateFileList = async (directoryToWatch) => {
      const res = await glob(directoryToWatch + '/**/*', { nodir: true });
      return res;
    };

    const rawHTML = await getHTMLTemplate(htmlFilePath);
    let html = rawHTML;
    let scripts = [];
    let styles = [];
    
    await esbuild.build(getConfig())

    const publicFiles = await updateFileList(dir.public);
    const files = await updateFileList(dir.dist);

    for (const publcFilePath of publicFiles) {
      if (path.basename(publcFilePath) !== args.template) {
        fsExtra.copySync(publcFilePath, `${dir.dist}/${path.basename(publcFilePath)}`);
      }
    }

    files.forEach((file) => {
      entryFiles.forEach(entry => {
        if (
          path.extname(file) === '.js' && 
          (path.basename(entry).split('.')[0] === path.basename(file).split('.')[0] ||
          path.basename(file).split('.')[0] === 'svg-insert')
        ) {
          scripts = [...scripts, file.replace(dir.dist, '')];
        }
      })
      if (path.extname(file) === '.css') styles = [...styles, file.replace(dir.dist, '')];
    })

    if (rawHTML) {
      fs.writeFile(
        `${dir.dist}/${args.template}`, 
        fillTemplate(await getHTMLTemplate(htmlFilePath), scripts, styles), 
        (err) => {
          if (err) {
            console.error('Error writing HTML file:', err);
          } else {
            console.log(`HTML file (${`${dir.dist}/${args.template}`}) created successfully!`);
          }
        }
      );
    }
    if (args.size) {
      const distFiles = (await updateFileList(dir.dist))
      .filter(s => {
        return path.extname(s) === '.js' && !publicFiles.some(f => path.basename(f) === path.basename(s));
      })
      sizeLimit([filePlugin, sizeLimitEsbuild, sizeLimitEsbuildWhy], distFiles).then((result, ...rest) => {
        console.log(result);
      })
    }
  } catch (error) {
    console.log('Error', error);
    process.exit(1)
  }
})()
