/* eslint-disable import/no-extraneous-dependencies */
import url from 'url';
import path from 'path';
import args from '../utils/args.js';

import { run } from 'jest';

const argv = process.argv.slice(2);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const preparedArgv = argv.slice(3);

preparedArgv.push(`--verbose`);
preparedArgv.push(`--config`);
preparedArgv.push(`${path.join(__dirname, '..')}/jest.config.mjs`);

if (!args.ci && !args.coverage && !args.precommit) {
  preparedArgv.push('--watch');
}
if (args.coverage) {
  preparedArgv.push('--coverage');
}

run(preparedArgv);
