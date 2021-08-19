const LoadablePlugin = require('@loadable/webpack-plugin');
const WebpackBar = require('webpackbar');
const buildMode = require('../buildMode');

let plugins = [
  new LoadablePlugin()
];

if (buildMode.isDevelop()) {
  plugins = [
    ...plugins,
    new WebpackBar({ name: 'server' })
  ];
}

module.exports = plugins;