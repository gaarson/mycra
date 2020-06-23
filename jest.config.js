const path = require('path');
const paths = require('./config/paths');
const args = require('./utils/args');

module.exports = {
  rootDir: paths.root,
  collectCoverageFrom: [
    `**/*.{${args.language}?(x)}`,
  ],
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$',
    '[/\\\\]node_modules[/\\\\].+\\.(ts|tsx)$',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': require.resolve('ts-jest'),
    '^.+\\.(js|jsx)$': require.resolve('babel-jest'),
    '^.+\\.svg$': require.resolve("jest-svg-transformer"),
    '^.+\\.css$': `${path.join(__dirname, '/config')}/jest/css.js`,
    '^(?!.*\\.(js|jsx|css|json)$)': `${path.join(__dirname, '/config')}/jest/file.js`,
  },
  moduleNameMapper: {
    '\\.svg': `${path.join(__dirname, '/__mocks__')}/fileMock.${args.language}`,
  },
  testURL: 'http://localhost',
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
