const dir = require('./paths');

module.exports = {
  hot: true,
  contentBase: dir.dist,
  compress: true,
  historyApiFallback: true,
  headers: {
    'Access-control-allow-origin': '*',
  },
};
