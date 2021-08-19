const express = require('express');
const path = require('path');
const dir = require('./paths');
const args = require('../utils/args');

const config = {
  publicPath: '/',
  compress: true,
  hot: true,
  historyApiFallback: true,
  open: true,
  //before(app) {
    //app.use('/', express.static(dir.public));
  //},
  stats: {
    colors: true,
  },
};

config.contentBase = args.pwa
  ? [path.resolve(dir.public), path.resolve(`${dir.app}/pwa/`)]
  : path.resolve(dir.public);

module.exports = config;