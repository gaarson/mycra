const webpack = require('webpack');
const dir = require('../config/paths.js');
const fs = require('fs');
const path = require('path');
const args = require('../utils/args.js');

const createAssetsJson = (assetsList, fileName = 'assets.json') => {
  fs.writeFile(path.join(dir.dist, fileName), JSON.stringify(assetsList), (err) => {
    if (err) {
      console.log(`File with assets "${fileName}" is NOT created`);
      throw err;
    }
    console.log(`File with assets "${fileName}" is created`);
  });
};

require('dotenv').config({ path: dir.env });

const prodConfig = require('../config/webpack.config');

const startBuild = () => new Promise((resolve, reject) => {
  webpack(prodConfig).run((err, stats) => {
    if (err || stats.hasErrors()) reject(stats.compilation.errors);

    if (args.pwa) {
      createAssetsJson([
        ...Object.keys(stats.compilation.assets),
        './'
      ]);
    }

    resolve();
  });
});

(async (startFunc) => {
  try {
    await startFunc();
  } catch (error) {
    console.error('Build failed', error);
    process.exit(1);
  }
})(startBuild);
