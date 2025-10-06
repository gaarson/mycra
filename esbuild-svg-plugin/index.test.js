import fs from 'fs';
import path from 'path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { expect, jest } from '@jest/globals';
import { mySvg } from ".";
import * as esbuild from 'esbuild';

describe('create svg plugin instance', () => {
  const watcherSpy = jest.fn();

  const dir = path.join(import.meta.dirname, './__mocks__');
  const imgSvgPath = path.join(import.meta.dirname, './__mocks__/img.svg');
  const picSvgPath = path.join(import.meta.dirname, './__mocks__/img2.svg');

  const plugin = mySvg(dir, dir)

  beforeAll(() => {
    watcherSpy.mockClear();
  });

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
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'http://localhost/',
  });

  const scriptContent = fs.readFileSync(path.resolve(import.meta.dirname, './__mocks__/svg-insert.js'), 'utf8');
  const scriptEl = dom.window.document.createElement('script');
  scriptEl.textContent = scriptContent;  // Или scriptEl.src, но для локального лучше textContent
  dom.window.document.head.appendChild(scriptEl);

  const context = dom.getInternalVMContext();

  vm.createContext(context);

  const getModuleContent = async (content) => {
    const transpiled = await esbuild.transform(content, {
      loader: 'jsx',
      format: 'esm',
      target: 'node18',
    });

    context.React = await import('react');

    const module = new vm.SourceTextModule(transpiled.code, {
      context, 
      identifier: 'dynamic-module.mjs',  
    });

    await module.link(() => {});
    await module.evaluate();

    return module.namespace.default;
  }

  test('module should return correct react component', (done) => { 
    const onLoad = async ({ filter }, handler) => {
      console.log('HANDLRE', handler)
      const result = await handler({ path: imgSvgPath }) 

      const data = await getModuleContent(result.contents);
      const renderedComponent = data();
      expect(JSON.stringify(renderedComponent.props)).toMatch('{"glyph":"img.svg","className":"icon"}')
      console.log(dom.window.document.querySelector('body').outerHTML);
      done();
    }

    plugin.setup({
      onResolve,
      onLoad
    });
    expect(watcherSpy).toHaveBeenCalledTimes(0);
  });

  test('module should return correct react component', (done) => { 
    const onLoad = async ({ filter }, handler) => {
      const result = await handler({ path: picSvgPath }) 

      const data = await getModuleContent(result.contents);
      const renderedComponent = data();
      expect(JSON.stringify(renderedComponent.props)).toMatch('{"glyph":"img2.svg","className":"icon"}')
      console.log(dom.window.document.querySelector('html').outerHTML);
      done();
    }

    plugin.setup({
      onResolve,
      onLoad
    });
    expect(watcherSpy).toHaveBeenCalledTimes(0);
  });

  afterAll(() => {
    dom.window.close();
  })
});

