const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const { APP_ENV_KEY } = require('../constants');
const args = require('../utils/args');
const buildMode = require('./buildMode');
const dir = require('./paths');

const env = Object.keys(process.env)
  .filter((key) => key.startsWith(APP_ENV_KEY))
  .reduce((acc, curr) => ({ 
    ...acc, 
    [curr.replace(APP_ENV_KEY, '')]: JSON.stringify(process.env[curr]) || '',
  }), {});

let plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.DefinePlugin({
    process: {
      env,
    },
  }),
  new webpack.NamedModulesPlugin(),
  new HtmlWebpackPlugin({
    template: `public/index.html`,
  }),
  //new webpack.ProvidePlugin({
    //fetch: 'imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch',
  //}),
  new SpriteLoaderPlugin(),
];

if (buildMode.isBundleSize()) {
  plugins = [
    ...plugins,
    new BundleAnalyzerPlugin(),
  ];
}

if (buildMode.isTest() || buildMode.isProduct() || !args.devServer) {
  plugins = [
    ...plugins,
    new CopyWebpackPlugin({
      patterns: [
        {
          from: `${dir.public}/`,
          to: './',
        },
      ],
    }),
  ];
}

if (args.clear) {
  plugins = [
    ...plugins,
    new CleanWebpackPlugin()
  ];
}

module.exports = plugins;
