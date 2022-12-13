const path = require('path');
const paths = require('./config/paths');
const args = require('./utils/args');
const env = require('./config/env');
const babelOptions = require('./babel.config');

module.exports = {
  rootDir: paths.root,
  collectCoverageFrom: [
    `**/*.{${args.language}?(x)}`,
  ],
  moduleDirectories: [
    'node_modules',
    paths.app,
  ],
  transformIgnorePatterns: [
    // '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
  ],
  transform: {
    '^.+\\.(js|jsx|tsx)$': [require.resolve('babel-jest'), babelOptions],
    '^.+\\.(ts)$': require.resolve('ts-jest'),
    '^.+\\.svg$': require.resolve('jest-transformer-svg'),
    '^.+\\.css$': `${path.join(__dirname, '/config')}/jest/css.js`,
    '^.+\?raw$': `${path.join(__dirname, '/config')}/jest/css.js`,
    '^(?!.*\\.(js|jsx|css|json)$)': `${path.join(__dirname, '/config')}/jest/file.js`,
  },
  globals: {
    "ts-jest": {
      tsconfig: `${paths.root}/tsconfig.jest.json`,
    },
    customEnv: env,
    glob: env,
  },
  moduleNameMapper: {
    "@/(.*)": paths.app,
    '\\.svg': `${path.join(__dirname, '/__mocks__')}/fileMock.${args.language}`,
    '^.+\?raw$': require.resolve('jest-raw-loader'),
  },
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  setupFiles: [`${path.join(__dirname, '/config')}/jest/setupEnv.js`],
  setupFilesAfterEnv: [`./${args.path}/setupTests.js`],
  testMatch: [
    `**/__tests__/**/*.${args.language}?(x)`,
    `**/?(*.)(spec|test).${args.language}?(x)`,
  ],
  moduleFileExtensions: [
    'web.js',
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'web.jsx',
    'node',
  ],
};
