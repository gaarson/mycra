const args = require('../utils/args');
const modeMap = new Map([
  ['start', 'development'],
  ['build', 'production'],
  ['test', 'test'],
]);

const mode = modeMap.get(process.argv[2]);

process.env.BABEL_ENV = mode; 
process.env.NODE_ENV = mode;

module.exports = {
  type: mode,
  isDevelop() { return mode === 'development'; },
  isProduct() { return mode === 'production'; },
  isTest() { return mode === undefined || mode === 'test'; },
  isBundleSize() { return args.size },
  isExpensive() { return args.expensive },
  isServer() { return args.server },
};
