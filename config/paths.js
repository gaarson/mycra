import path from 'path';
import args from '../utils/args.js';

const root = path.join(process.cwd());

const modeMap = new Map([
  ['start', 'development'],
  ['build', 'production'],
  ['test', 'test'],
]);

const mode = modeMap.get(process.argv[2]);

export default {
  root,
  app: path.join(root, args.path || 'app'),
  dist: path.join(root, args.outputDir),
  js: path.join(root, 'public/static/js'),
  public: path.join(root, args.public),
  node_modules: path.join(root, 'node_modules'),
  env: path.join(root, `.env.${mode}`),
};
