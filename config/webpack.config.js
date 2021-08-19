const plugins = require('./plugins');
const loaders = require('./loaders');
const buildMode = require('./buildMode');
const args = require('../utils/args');
const dir = require('./paths');

const devtoolDev = process.env.npm_config_sourcemaps ? 'inline-source-map' : 'inline-eval';

let devtool;

if (args['source-map']) {
  devtool = 'source-map';
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
  optimization: {
    runtimeChunk: 'multiple',
    usedExports: true,
    splitChunks: {
      chunks: 'all',
    },
  },
};
