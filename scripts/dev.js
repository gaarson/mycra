/* eslint-disable import/no-extraneous-dependencies */
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const { DEFAULT_PORT, DEFAULT_HOST } = require('../constants');
const dir = require('../config/paths.js');
const args = require('../utils/args');

require('dotenv').config({
  path: dir.env,
});

const HOST = process.env.HOST || DEFAULT_HOST;
const PORT = process.env.PORT || DEFAULT_PORT;

const devConfig = require('../config/webpack.config');
const devServerConfig = require('../config/webpackDevServer.config');

const compiler = webpack(devConfig);

if (args.devServer) {
  const devServer = new WebpackDevServer(compiler, devServerConfig);

  devServer.listen(PORT, HOST, (err) => {
    if (err) console.log(err);
    
    compiler.hooks.invalid.tap('invalid', () => {
      if (process.stdout.isTTY) {
        console.clear();
      }

      console.log('Building...');
    });
  });
}

if (!args.devServer) {
  compiler.watch({
    aggregateTimeout: 200,
    poll: 100
  }, (err, stats) => {
    if (err || stats.hasErrors()) {
      console.error('error', stats.compilation.errors);
    }
    console.log(stats);
  });
}


