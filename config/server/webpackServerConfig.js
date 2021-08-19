const path = require('path');
const buildMode = require('../buildMode');
const plugins = require('./plugins');
const loaders = require('./loaders');
const dir = require('../paths');
const TerserPlugin = require('terser-webpack-plugin');

const config = {
  mode: buildMode.type,
  devtool: 'source-map',
  target: 'node',
  entry: [require.resolve('@babel/polyfill'), `${dir.app}/server.tsx`],
  // entry: ['@babel/polyfill', `${dir.app}/server.tsx`],
  output: {
    path: dir.dist,
    filename: '[name].build.js',
  },
  module: {
    rules: loaders,
  },
  plugins,
  stats: {
    colors: true,
    modules: false,
    children: false
  },
  performance: {
    hints: false
  },
  resolve: {
    modules: ['node_modules', dir.app, dir.public],
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.css', '.svg', '.json'],
  },
};

if (buildMode.isProduct()) {
  config.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true,
        terserOptions: {
          output: {
            comments: false,
            ascii_only: true
          }
        }
      })
    ]
  };
}

module.exports = config;