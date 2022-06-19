const express = require('express');
const path = require('path');
const dir = require('./paths');
const args = require('../utils/args');

const directory = args.pwa
  ? [path.resolve(dir.public), path.resolve(`${dir.app}/pwa/`)]
  : path.resolve(dir.public);

const config = {
  compress: true,
  historyApiFallback: true,
  open: true,
  client: {
    logging: 'info',
    overlay: true,
    progress: true,
  },
  static: {
    directory,
    publicPath: '/',
    serveIndex: true,
    watch: true,
  }
};

module.exports = config;
