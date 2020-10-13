const args = process.argv.slice(2);

const argsDefinitions = [
  {
    name: 'path', alias: 'p', type: String, default: 'app',
  },
  {
    name: 'language', alias: 'l', type: String, default: 'ts',
  },
  {
    name: 'language', alias: 'l', type: String, default: 'ts',
  },
  { name: 'size', alias: 's', type: Boolean },
  { name: 'expensive', alias: 'e', type: Boolean },
  { name: 'coverage', alias: 'c', type: Boolean },
  { name: 'ci', type: Boolean },
  { name: 'precommit', type: Boolean },
];

const result = {};

argsDefinitions.forEach((def) => {
  result[def.name] = def.default;
  const arg = args.findIndex((item) => {
    const nameRegex = new RegExp(`(?!-+)(${def.name})(?!==)`);
    const aliasRegex = new RegExp(`(^-)(${def.alias})`);
    return nameRegex.test(item) || aliasRegex.test(item);
  });

  if (args[arg]) {
    const value = args[arg].split('=')[1]
      || (def.type === String && args[arg + 1]);

    result[def.name] = value || true;
  }
});

module.exports = result;
