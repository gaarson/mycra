const express = require('express');
const path = require('path');
const dir = require('./paths');

module.exports = {
  contentBase: path.resolve(dir.public),
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

