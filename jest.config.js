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
     '^.+\\.css$': `${path.join(__dirname, '/config')}/jest/css.js`,
    '^(?!.*\\.(js|jsx|css|json)$)': `${path.join(__dirname, '/config')}/jest/file.js`,
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
