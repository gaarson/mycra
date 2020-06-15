const express = require('express');
const path = require('path');
const dir = require('./paths');

module.exports = {
  contentBase: path.resolve(dir.root, 'dist', 'webpack'),
  publicPath: '/',
  compress: true,
  hot: true,
  historyApiFallback: true,
  open: true,
  stats: {
    colors: true,
  },
};

