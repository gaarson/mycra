import { jest } from '@jest/globals';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

import '@testing-library/jest-dom';

const require = createRequire(import.meta.url);

const csstree = require('css-tree');  // Теперь require работает

jest.mock('css-tree', () => ({
  ['parse']: csstree.parse,
  ['walk']: csstree.walk,
  ['generate']: csstree.generate,
}));

jest.mock('minify', () => ({
  minify: jest.fn((content) => content),
}));

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost' });
global.document = dom.window.document;
global.window = dom.window;

