import fs from 'node:fs';

import dir from '../config/paths.js';
import args from './args.js';

export const getHTMLTemplate = (pathname) => {
  return new Promise((resolve, reject) => {
    fs.exists(pathname, function (exist) {
      if(!exist) {
        console.error('File doesn`t exists');
        resolve('');
      }

      if (exist && fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

      if (exist) {
        fs.readFile(pathname, 'utf8', function(err, data){
          if(err){
            console.error('ERROR: ', err);
          } else {
            resolve(data);
          }
        });
      }
    });
  })
};

export const fillTemplate = (
  html,
  scripts, 
  styles
) => {
  if (html) {
    let newHTML = html.replace('<!--[styles]-->', styles.reduce((stylesStr, styleSrc) => {
      return stylesStr + `<link rel="stylesheet" type="text/css" href="${styleSrc}">\n`
    }, ''))
    newHTML = newHTML.replace('<!--[scripts]-->', scripts.reduce((scriptStr, scriptSrc) => {
      return scriptStr + `<script type="module" src="${scriptSrc}"></script>\n`
    }, `<script>new EventSource('/esbuild').addEventListener('change', () => location.reload())</script>\n`))

    return newHTML;
  }

  return html;
}
