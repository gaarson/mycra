/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
const args = require('../utils/args');
const paths = require('../config/paths');

const jest = require('jest');

const argv = process.argv.slice(2);

const preparedArgv = argv.slice(3);

preparedArgv.push(`--verbose`);
preparedArgv.push(`--config`);
preparedArgv.push(`${path.join(__dirname, '..')}/jest.config.js`);


// Watch unless on CI or in coverage mode
if (!args.ci && !args.coverage) {
  preparedArgv.push('--watch');
}

jest.run(preparedArgv);
