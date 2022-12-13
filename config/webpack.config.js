const path = require('path');
const plugins = require('./plugins');
const loaders = require('./loaders');
const buildMode = require('./buildMode');
const args = require('../utils/args');
const dir = require('./paths');

const devtoolDev = 'eval-cheap-source-map';

const cacheDir = path.resolve(dir.root, 'node_modules', '.cache');

let devtool;

if (args['source-map']) {
  devtool = 'inline-source-map';
} else {
  devtool = buildMode.isDevelop() ? devtoolDev : undefined;
}

const baseFileName = buildMode.isDevelop() || buildMode.isTest() 
  ? '[name]' 
  : '[name].[hash:8]';

module.exports = {
  mode: buildMode.type,
  devtool,
  entry: [require.resolve('@babel/polyfill'), dir.app],
  output: {
    path: dir.dist,
    filename: `./js/${baseFileName}.js`,
    chunkFilename: `./js/${baseFileName}.chunk.js`,
    publicPath: '/',
  },
  module: {
    rules: loaders,
  },
  resolve: {
    modules: [
      'node_modules', 
      dir.app,
      dir.public,
    ],
    alias: {
      'src': dir.app,
      '@': dir.app
    },
    fallback: {
      "net": false,
      "fs": require.resolve('browserify-fs'),
      "stream": require.resolve('stream-browserify'),
      "request": require.resolve('request'),
      "os": require.resolve("os-browserify/browser"),
      "process": require.resolve("process/browser"),
      "path": require.resolve("path-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      // "buffer": require.resolve("buffer/"),
      "url": require.resolve("url/")
    },
    extensions: [
      '.tsx', 
      '.ts', 
      '.js', 
      '.jsx', 
      '.css', 
      '.scss',
      '.svg', 
      '.json',
    ],
  },
  plugins,
  cache: {
    type: 'filesystem',
    cacheDirectory: cacheDir,
  },
  optimization: {
    runtimeChunk: 'multiple',
    moduleIds: 'named',
    usedExports: true,
    splitChunks: {
      chunks: 'all',
    },
  },
};
