const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const InterpolateHtmlPlugin = require('interpolate-html-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin');
const { NormalModuleReplacementPlugin } = webpack;

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
  new InterpolateHtmlPlugin({ NODE_ENV: buildMode.type }),
  new NodePolyfillPlugin(),
  new SpriteLoaderPlugin(),
];

if (!args.skipTypeChecking) {
  plugins = [
    ...plugins,
    new ForkTsCheckerWebpackPlugin({
      async: true,
      typescript: {
        memoryLimit: 1024,
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
      },
    }),
  ];
}

if (args.module === undefined) {
  plugins = [
    ...plugins,
    new HtmlWebpackPlugin({
      template: `${dir.public}/index.html`,
      templateParameters: {
        manifestLink
      }
    }),
  ];
}

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

if (args.module) {
  const replacerFilePath = require.resolve('../utils/module-replacer');

  plugins = [
    ...plugins,
    new NormalModuleReplacementPlugin(
      /package-mock/,
     `${dir.root}/node_modules/react`
    ),
    new NormalModuleReplacementPlugin(
      /^[react]+$/,
      replacerFilePath
    ),
  ];
}

if (args.includeModules) {
  const modules = args.includeModules.split(',');
  const replacerFilePath = require.resolve('../utils/module-replacer');

  copyPatterns = [
    ...copyPatterns,
    {
      from: replacerFilePath,
      to: './'
    },
    ...modules.map(module => {
      return {
        from: `${dir.root}/${module}/`,
        to: `./${module}/`,
      };
    })
  ];

  plugins = [
    ...plugins,
    new HtmlWebpackTagsPlugin({ 
      append: false,
      tags: modules.map((module) => {
        return {
          type: 'js',
          path: `${module}/main.js`
        };
      }),
    })
  ];
}

if (args.pwa) {
  copyPatterns = [
    ...copyPatterns,
    {
      from: `${dir.app}/pwa/`,
      to: './'
    }
  ];
}

if (
  (buildMode.isTest() || 
  buildMode.isProduct() || 
  !args.devServer) && args.module === undefined
) {
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
