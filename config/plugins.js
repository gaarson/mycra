const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const InterpolateHtmlPlugin = require('interpolate-html-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const args = require('../utils/args');
const buildMode = require('./buildMode');
const dir = require('./paths');
const env = require('./env');

const manifestLink = args.pwa
  ? '<link rel="manifest" href="manifest.json">'
  : '';

let plugins = [
  new webpack.DefinePlugin({ glob: { env } }),
  new webpack.ProvidePlugin({
      process: require.resolve('process/browser'),
      Buffer: [require.resolve("buffer"), 'Buffer'],
  }),
  new HtmlWebpackPlugin({
    template: `${dir.public}/index.html`,
    templateParameters: {
      manifestLink
    }
  }),
  new InterpolateHtmlPlugin({ NODE_ENV: buildMode.type }),
  new NodePolyfillPlugin(),
  new ForkTsCheckerWebpackPlugin({
    async: true,
    typescript: {
      diagnosticOptions: {
        semantic: true,
        syntactic: true,
      },
    },
  }),
  new SpriteLoaderPlugin(),
];

if (buildMode.isBundleSize()) {
  plugins = [
    ...plugins,
    new BundleAnalyzerPlugin(),
  ];
}

if (args.devServer) {
  plugins = [
    ...plugins,
    new webpack.HotModuleReplacementPlugin(),
  ];
}

let copyPatterns = [];

if (args.pwa) {
  copyPatterns = [
    ...copyPatterns,
    {
      from: `${dir.app}/pwa/`,
      to: './'
    }
  ];
}

if (buildMode.isTest() || buildMode.isProduct() || !args.devServer) {
  copyPatterns = [
    ...copyPatterns,
    {
      from: `${dir.public}/`,
      to: './',
      globOptions: {
        ignore: !args.devServer ? ['**/*.html'] : [],
      },
    },
  ];
}

if (copyPatterns.length) {
  plugins = [
    ...plugins,
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /ru/),
    new CopyWebpackPlugin({
      patterns: copyPatterns
    })
  ];
}

if (args.clear) {
  plugins = [
    ...plugins,
    new CleanWebpackPlugin()
  ];
}

module.exports = plugins;
