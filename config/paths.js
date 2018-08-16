const path = require('path');

const root = path.join(__dirname, '../');

module.exports = {
  root,
  app: path.join(root, 'app'),
  dist: path.join(root, 'dist'),
  js: path.join(root, 'public/static/js'),
  public: path.join(root, 'public'),
  env: path.join(root, '.env'),
};
