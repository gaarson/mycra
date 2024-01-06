import url from 'url';
import path from 'path';
import paths from './config/paths.js';
import args from './utils/args.js';
import env from './config/env.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export default {
  rootDir: paths.root,
  collectCoverageFrom: [
    `**/*.ts?(x)}`,
  ],
  moduleDirectories: [
    'node_modules',
    paths.app,
  ],
  transformIgnorePatterns: [
    // '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
  ],
  transform: {
    '^.+\\.(ts|js|jsx|tsx)$': path.join(__dirname, './node_modules/esbuild-runner/jest.js'),
    '^.+\\.svg$': path.join(__dirname, './node_modules/jest-transformer-svg/lib/index.js'),
    '^.+\\.css$': `${path.join(__dirname, '/config')}/jest/css.js`,
    '^.+\?raw$': `${path.join(__dirname, '/config')}/jest/css.js`,
    '^(?!.*\\.(js|jsx|css|json)$)': `${path.join(__dirname, '/config')}/jest/file.js`,
  },
  globals: {
    customEnv: env,
    glob: env,
  },
  moduleNameMapper: {
    "@/(.*)": paths.app,
    '\\.svg': `${path.join(__dirname, '/__mocks__')}/fileMock.ts`,
    '^.+\?raw$': path.join(__dirname, './node_modules/jest-raw-loader/lib/index.js'),
  },
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  setupFiles: [`${path.join(__dirname, '/config')}/jest/setupEnv.js`],
  setupFilesAfterEnv: [`./${args.path}/setupTests.js`],
  testMatch: [
    `**/__tests__/**/*.ts?(x)`,
    `**/?(*.)(spec|test).ts?(x)`,
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
