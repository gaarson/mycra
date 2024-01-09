import url from 'url';
import path from 'path';
import paths from './config/paths.js';
import args from './utils/args.js';
import env from './config/env.js';
import { createRequire } from 'node:module';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const require = createRequire(import.meta.url);

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
    '^.+\\.(ts|js|jsx|tsx)$': require.resolve('esbuild-runner/jest.js'),
    '^.+\\.svg$': require.resolve('jest-transformer-svg'),
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
    '^.+\?raw$': require.resolve('jest-raw-loader'),
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
