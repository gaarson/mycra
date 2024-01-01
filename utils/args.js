const args = process.argv.slice(2);

const argsDefinitions = [
  { name: 'path', alias: 'p', type: String, default: 'app' },
  { name: 'language', alias: 'l', type: String, default: 'ts' },
  { name: 'outputDir', alias: 'd', type: String, default: 'dist' },
  { name: 'size', alias: 's', type: Boolean },
  { name: 'expensive', alias: 'e', type: Boolean },
  { name: 'coverage', alias: 'c', type: Boolean },
  { name: 'devServer', alias: 'ds', type: Boolean },
  { name: 'clear', alias: 'cl', type: Boolean },
  { name: 'public', alias: 'pb', type: String, default: 'public' },
  { name: 'publicPath', alias: 'pp', type: String, default: '/' },
  { name: 'source-map', alias: 'sm', type: Boolean },
  { name: 'ci', type: Boolean },
  { name: 'server', alias: 'ssr', type: String, default: undefined },
  { name: 'pwa', type: Boolean },
  { name: 'skipTypeChecking', alias: 'stc', type: Boolean, default: false },
  { name: 'module', alias: 'm', type: String, default: undefined },
  { name: 'includeModules', alias: 'im', type: String, default: undefined },
  { name: 'nodePolyfills', type: Boolean, alias: 'np', default: false },
  { name: 'splitSvg', type: Boolean, alias: 'ssvg',  default: false },
  { name: 'template', type: String, alias: 't', default: 'index.html' }
];

const result = {};

const removeTires = (str) => str ? str.replace('-', '').replace('-', '') : null;

argsDefinitions.forEach((def) => {
  result[def.name] = def.default;

  const arg = args.findIndex((item) => {
    const argument = removeTires(item);
    const nameRegex = new RegExp(`(?!-+)(${def.name})(?!==)`);
    const aliasRegex = new RegExp(`(^-)(${def.alias})`);
    const name = removeTires(item.match(nameRegex) ? item.match(nameRegex)[0] : null);
    const alias = removeTires(item.match(aliasRegex) ? item.match(aliasRegex)[0] : null);

    return name === argument || alias === argument;
  });

  if (args[arg]) {
    const value = args[arg].split('=')[1]
      || (def.type === String && args[arg + 1]);

    result[def.name] = value || true;
  }
});

export default result;
