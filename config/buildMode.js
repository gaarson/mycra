import args from '../utils/args.js';

const modeMap = new Map([
  ['start', 'development'],
  ['build', 'production'],
  ['test', 'test'],
  ['es-start', 'es-development'],
  ['es-build', 'es-production'],
]);

const mode = modeMap.get(process.argv[2]);

process.env.BABEL_ENV = mode; 
process.env.NODE_ENV = mode;

const hashCode = (s) => {
  let h;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return h;
};

export default {
  type: mode,
  simpleClassHash: mode === undefined || mode === 'test' 
  ? '[local]' 
  : (local, path) => {
    return mode === undefined || mode === 'test' 
      ? local 
      : `${local}_${hashCode(local + path)}`;
  },
  isDevelop() { return mode === 'development'; },
  isProduct() { return mode === 'production'; },
  isTest() { return mode === undefined || mode === 'test'; },
  isBundleSize() { return args.size },
  isExpensive() { return args.expensive },
  isServer() { return args.server },
};
