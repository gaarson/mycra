import { jest } from '@jest/globals';
import { createRequire } from 'node:module';

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
