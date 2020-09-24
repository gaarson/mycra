const plugins = require('./plugins');
const loaders = require('./loaders');
const buildMode = require('./buildMode');
const dir = require('./paths');

const devtoolDev = process.env.npm_config_sourcemaps ? 'inline-source-map' : 'inline-eval';

module.exports = {
  mode: buildMode.type,
  devtool: buildMode.isDevelop ? devtoolDev : undefined,
  entry: [require.resolve('@babel/polyfill'), dir.app],
  output: {
    path: dir.dist,
    filename: './js/[name].[hash:8].js',
    chunkFilename: './js/[name].[hash:8].chunk.js',
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
