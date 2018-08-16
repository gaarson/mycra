/* eslint-disable import/no-extraneous-dependencies */

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const dir = require('../config/paths.js');
require('dotenv').config({
  path: dir.env,
});

const { HOST, DEV_PORT } = process.env;

const devConfig = require('../config/webpack.config.dev');

const compiler = webpack(devConfig);
const devServer = new WebpackDevServer(compiler, {
  contentBase: dir.dist,
  hot: true,
  inline: true,
  compress: true,
  historyApiFallback: false,
  headers: {
    'Access-control-allow-origin': '*',
  },
  stats: {
    colors: true,
  },
});

devServer.listen(DEV_PORT, HOST, (err) => {
  if (err) {
    console.log(err);
  }
  compiler.hooks.invalid.tap('invalid', () => {
    if (process.stdout.isTTY) {
      console.clear();
    }

    console.log('Building...');
  });
});
