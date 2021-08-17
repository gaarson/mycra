import fs from 'fs';
import path from 'path';

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
