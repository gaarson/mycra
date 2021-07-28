const path = require('path');
const paths = require('./config/paths');
const args = require('./utils/args');
const env = require('./config/env');

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
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$',
    '[/\\\\]node_modules[/\\\\].+\\.(ts|tsx)$',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      require.resolve('babel-jest'), 
      { configFile: `${path.join(__dirname, '/')}babel.config.js` }
    ],
    '^.+\\.(ts|tsx)$': require.resolve('ts-jest'),
    '^.+\\.svg$': require.resolve('jest-svg-transformer'),
    '^.+\\.css$': `${path.join(__dirname, '/config')}/jest/css.js`,
    '^(?!.*\\.(js|jsx|css|json)$)': `${path.join(__dirname, '/config')}/jest/file.js`,
  },
  globals: {
    "ts-jest": {
      tsConfig: `${paths.root}/tsconfig.jest.json`,
    },
    customEnv: env,
  },
  moduleNameMapper: {
    '\\.svg': `${path.join(__dirname, '/__mocks__')}/fileMock.${args.language}`,
  },
  testURL: 'http://localhost',
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
