const path = require('path');

module.exports = {
  collectCoverageFrom: [
    path.join(__dirname, 'app/**/*.{js,jsx}'),
  ],
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$',
  ],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.css$': './config/jest/css.js',
    '^(?!.*\\.(js|jsx|css|json)$)': './config/jest/file.js',
  },
  testURL: 'http://localhost',
  setupTestFrameworkScriptFile: path.join(__dirname, 'app/setupTests.js'),
  browser: true,
  testMatch: [
    path.join(__dirname, 'app/**/__tests__/**/*.js?(x)'),
    path.join(__dirname, 'app/**/?(*.)(spec|test).js?(x)'),
  ],
  moduleFileExtensions: [
    'web.js',
    'js',
    'jsx',
    'json',
    'web.jsx',
    'node',
  ],
};
