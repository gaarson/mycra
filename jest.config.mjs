import url from 'url';
import fs from 'fs';
import path from 'path';
import paths from './config/paths.js';
import args from './utils/args.js';
import env from './config/env.js';
import { createRequire } from 'node:module';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const require = createRequire(import.meta.url);

const checkFileExists = (filePath) => {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) resolve(false);
      else resolve(true);
    });
  });
}

const setupTestsFilePath = await checkFileExists(`./${args.path}/setupTests.js`) 
  ? `./${args.path}/setupTests.js` 
  : `./setupTests.js`

export default {
  rootDir: paths.root,
  collectCoverageFrom: [
    `**/*.ts?(x)}`,
    `**/*.js?(x)}`,
  ],
  moduleDirectories: [
    'node_modules',
    paths.app,
  ],
  modulePathIgnorePatterns: args.ignorePaths?.split(',') || [],
  transformIgnorePatterns: [
    // '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
  ],
  transform: process.env.MYCRA_TEST_SELF ? {} : {
    // '^.+\\.(ts|js|jsx|tsx)$': require.resolve('esbuild-runner/jest.js'),
    '^.+\\.(ts|js|jsx|tsx)$': `${path.join(__dirname, '/config')}/jest/transformer.js`,
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
  testEnvironment: process.env.MYCRA_TEST_SELF  ? 'node' : 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  setupFiles: [`${path.join(__dirname, '/config')}/jest/setupEnv.js`],
  setupFilesAfterEnv: [setupTestsFilePath],
  testMatch: [
    `**/__tests__/**/*.ts?(x)`,
    `**/?(*.)(spec|test).ts?(x)`,
    `**/__tests__/**/*.js?(x)`,
    `**/?(*.)(spec|test).js?(x)`,
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
