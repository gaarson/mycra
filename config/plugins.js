const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const args = require('../utils/args');
const buildMode = require('./buildMode');
const dir = require('./paths');
const env = require('./env');

let plugins = [
  new webpack.DefinePlugin({
    process: { env },
  }),
  new webpack.NamedModulesPlugin(),
  new HtmlWebpackPlugin({
    template: `${dir.public}/index.html`,
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

if (args.devServer) {
  plugins = [
    ...plugins,
    new webpack.HotModuleReplacementPlugin(),
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
          globOptions: {
            ignore: !args.devServer ? ['**/*.html'] : [],
          },
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
