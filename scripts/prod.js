/* eslint-disable import/no-extraneous-dependencies */

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const webpack = require('webpack');

const dir = require('../config/paths.js');
require('dotenv').config({
  path: dir.env,
});

const prodConfig = require('../config/webpack.config.prod');

webpack(prodConfig).run((err, stats) => {
  if (err || stats.hasErrors()) {
    console.log(err);
    console.log(stats);
  }
});
