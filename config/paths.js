const path = require('path');
const args = require('../utils/args');

const root = path.join(process.cwd());

const modeMap = new Map([
  ['start', 'development'],
  ['build', 'production'],
  ['test', 'test'],
]);

const mode = modeMap.get(process.argv[2]);

module.exports = {
  root,
  app: path.join(root, args.path || 'app'),
  dist: path.join(root, 'dist'),
  js: path.join(root, 'public/static/js'),
  public: path.join(root, 'public'),
  node_modules: path.join(root, 'node_modules'),
  env: path.join(root, `.env.${mode}`),
};
