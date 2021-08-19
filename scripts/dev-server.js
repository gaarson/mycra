/* eslint-disable import/no-extraneous-dependencies */
const webpack = require('webpack');
const args = require('../utils/args');
const dir = require('../config/paths.js');

require('dotenv').config({
  path: dir.env,
});

const devConfig = require('../config/server/webpackServerConfig');
const compiler = webpack(devConfig);

if (args.server === 'w' || args.server === 'watch') {
  compiler.watch({
    aggregateTimeout: 200,
    poll: 100
  }, (err, stats) => {
    if (err || stats.hasErrors()) {
      console.error('error', stats.compilation.errors);
    }
    console.log(stats.toString());
  });
}

if (args.server === true) {
  compiler.run((err, stats) => {
    if (err || stats.hasErrors()) {
      console.error('error', stats.compilation.errors);
    }
    console.log(stats.toString());
  });
}