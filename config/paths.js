const path = require('path');
const args = require('../utils/args');

const root = path.join(process.cwd());

module.exports = {
  root,
  app: path.join(root, args.path || 'app'),
  dist: path.join(root, 'dist'),
  js: path.join(root, 'public/static/js'),
  public: path.join(root, 'public'),
  node_modules: path.join(root, 'node_modules'),
  env: path.join(root, '.env'),
};
