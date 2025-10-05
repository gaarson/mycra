import { beforeAll, expect, jest } from '@jest/globals';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

import path from 'path';
import { stylePerPlugin } from ".";
import { hashCode } from '../config/buildMode';


describe('create plugin instance', () => {
  const watcherSpy = jest.fn();
  const options = {
    extract: undefined,
    cssModulesOptions: {
      generateScopedName:  () => {
        return `TEST_HASH`;
      }
    },
  }

  const testCssPath = path.join(import.meta.dirname, './__mocks__/test.css');
  const testScssPath = path.join(import.meta.dirname, './__mocks__/test.scss');
  const testSassPath = path.join(import.meta.dirname, './__mocks__/test.sass');

  let plugin

  beforeAll(() => {
    watcherSpy.mockClear();
    plugin = stylePerPlugin(options)
  })


  const onResolve = async ({ filter }, handler) => {
    await handler({}, {namespace: 'test'})
  }

  const dom = new JSDOM(`
      <!DOCTYPE html>
        <html>
          <head></head>
          <body><div class="test"></div></body>
        </html>
    `, {
    runScripts: 'dangerously',  // Включаем выполнение скриптов (осторожно с untrusted кодом!)
    resources: 'usable',  // Для загрузки внешних ресурсов, если нужно
    url: 'http://localhost/',  // Симулируем URL для relative импортов
  });

  const context = dom.getInternalVMContext();

  vm.createContext(context);

  const getModuleContent = async (content) => {
    const module = new vm.SourceTextModule(content, {
      context, 
      identifier: 'dynamic-module.mjs',  
    });

    await module.link(() => {});
    await module.evaluate();

    const result = module.namespace;

    return result.default;
  }

  test('css imports works', (done) => { 
    const onLoad = async ({ filter }, handler) => {
      handler({ path: testCssPath }).then(async (fileData) => {
        expect(await getModuleContent(fileData.contents)).toMatchObject({test: 'TEST_HASH'})

        done()
      });
    }
    plugin.setup({
      onResolve,
      onLoad,
      initialOptions: { minify: false },
      resolve: () => {
        return { path: testCssPath, errors: [] }
      }
    });
  });

  test('scss imports works', (done) => { 
    const onLoad = async ({ filter }, handler) => {
      handler({ path: testScssPath }).then(async (fileData) => {
        expect(await getModuleContent(fileData.contents)).toMatchObject({test: 'TEST_HASH'})
        done()
      });
    }
    plugin.setup({
      onResolve,
      onLoad,
      initialOptions: { minify: false },
      resolve: () => {
        return { path: testCssPath, errors: [] }
      }
    });
  });

  test('sass imports works', (done) => { 
    const onLoad = async ({ filter }, handler) => {
      handler({ path: testSassPath }).then(async (fileData) => {
        expect(await getModuleContent(fileData.contents)).toMatchObject({
          test: 'TEST_HASH',
          'test-test': 'TEST_HASH',
          'test_test': 'TEST_HASH',
          'testTest': 'TEST_HASH'
        })

        done()
      });
    }
    plugin.setup({
      onResolve,
      onLoad,
      initialOptions: { minify: false },
      resolve: () => {
        return { path: testCssPath, errors: [] }
      }
    });
  });

  test('shouldn`t create duplicate style tag on same second import', (done) => { 
    try {
      const onLoad = async ({ filter }, handler) => {
        handler({ path: testCssPath }).then(async (fileData) => {
          expect(await getModuleContent(fileData.contents)).toMatchObject({test: 'TEST_HASH'})

          expect(dom.window.document.querySelectorAll(`#css${hashCode(testCssPath)}`).length).toBe(1)

          done()
        });
      }
      plugin.setup({
        onResolve,
        onLoad,
        initialOptions: { minify: false },
        resolve: () => {
          return { path: testCssPath, errors: [] }
        }
      });

    } catch (error) {
      throw Error(error);
    }
  });

  afterAll(() => {
    dom.window.close();
  })
});

