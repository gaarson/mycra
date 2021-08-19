const args = process.argv.slice(2);

const argsDefinitions = [
  { name: 'path', alias: 'p', type: String, default: 'app' },
  { name: 'language', alias: 'l', type: String, default: 'ts' },
  { name: 'size', alias: 's', type: Boolean },
  { name: 'expensive', alias: 'e', type: Boolean },
  { name: 'coverage', alias: 'c', type: Boolean },
  { name: 'devServer', alias: 'ds', type: Boolean },
  { name: 'clear', alias: 'cl', type: Boolean },
  { name: 'source-map', alias: 'sm', type: Boolean },
  { name: 'ci', type: Boolean },
  { name: 'server', alias: 'ssr', type: String, default: undefined },
  { name: 'pwa', type: Boolean }
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

module.exports = result;
