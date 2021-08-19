const webpack = require('webpack');
const dir = require('../config/paths.js');

require('dotenv').config({
  path: dir.env,
});

const prodConfig = require('../config/server/webpackServerConfig');

const startBuild = () => new Promise((resolve, reject) => {
  webpack(prodConfig).run((err, stats) => {
    if (err || stats.hasErrors()) reject(stats.compilation.errors);
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