import fs from 'fs';
import path from 'path';
import paths from '../config/paths';

const replaceSources = (str = '') => str.replaceAll('/./', '/static/');
const isProduction = process.env.NODE_ENV === 'production';

export const getListOfStyles = (base, ext, files, result) => {
  files = files || fs.readdirSync(base);
  result = result || [];

  files.forEach(
    function (file) {
      const newbase = path.join(base, file);
      if (fs.statSync(newbase).isDirectory()) {
        result = getListOfStyles(newbase, ext, fs.readdirSync(newbase), result);
      }
      else
      {
        if ( file.substr(-1*(ext.length+1)) == '.' + ext )
        {
          let isCss = true;
          result.push(newbase
            .split('/')
            .reverse()
            .filter((dir) => {
              if (dir === 'css') {
                isCss = false;
                return isCss;
              }
              return isCss;
            }).reverse().join('/')
          );
        }
      }
    }
  );
  return result;
};

export const getHTMLFile = (renderedString, initialState, styles, cssFiles) => {
  const indexFile = path.join(paths.dist, 'index.html');

  if (!isProduction) {
    styles = fs.existsSync(cssFiles)
      ? getListOfStyles(cssFiles, 'css')
      : [];
  }

  return new Promise((resolve, reject) => {
    fs.readFile(indexFile, 'utf8', (err, data) => {
      if (err) reject(err);

      const links = styles.map(file => {
        const result = process.platform === 'win32'
          ? file.substring(file.indexOf('\\css\\') + 5).replaceAll('\\', '/')
          : file;
        return `<link rel="stylesheet" type="text/css" href="/static/css/${result}">`;
      });

      const htmlTemplate = replaceSources(data)
        .replace(
          '<div id="root"></div>',
          `<div id="root">${renderedString}</div>`
        ).replace(
          '<script></script>',
          `<script>${initialState}</script>`
        ).replace(
          '<link>',
          links.join('')
        );

      resolve(htmlTemplate);
    });
  });
};
