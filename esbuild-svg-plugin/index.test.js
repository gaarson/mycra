import path from 'path';
import vm from 'node:vm';
import { expect, describe, test } from '@jest/globals';
import * as esbuild from 'esbuild';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { mySvg } from ".";

describe('esbild-svg-my plugin', () => {
  const dir = path.join(import.meta.dirname, './__mocks__');
  const imgSvgPath = path.join(dir, 'img.svg?react');

  const getModuleContent = async (content) => {
    const transpiled = await esbuild.transform(content, { loader: 'jsx', format: 'esm' });
    
    const context = vm.createContext({}); 

    const module = new vm.SourceTextModule(transpiled.code, {
      context,
      identifier: 'dynamic-svg-module.mjs',
      initializeImportMeta(meta) { meta.url = path.toFileUrl(import.meta.filename); },
    });
    await module.link(async (specifier) => {
      if (specifier === 'react') {
        const reactModule = await import('react');
        const exportNames = [...new Set(['default', ...Object.keys(reactModule)])];
        return new vm.SyntheticModule(exportNames, function () {
          this.setExport('default', reactModule);
          for (const key of Object.keys(reactModule)) { this.setExport(key, reactModule[key]); }
        }, { context });
      }
      throw new Error(`Unable to resolve dependency: ${specifier}`);
    });
    await module.evaluate();
    return module.namespace.default;
  };

  test('should resolve path and return a React component from onLoad', async () => {
    const pluginHandlers = {};
    const mockBuild = {
      onResolve: (options, callback) => { pluginHandlers.onResolve = callback; },
      onLoad: (options, callback) => { pluginHandlers.onLoad = callback; },
      onEnd: (callback) => { pluginHandlers.onEnd = callback; },
    };
    const plugin = mySvg(dir);
    plugin.setup(mockBuild);

    const resolveArgs = { path: './img.svg?react', resolveDir: dir };
    const resolveResult = pluginHandlers.onResolve(resolveArgs);
    const loadResult = pluginHandlers.onLoad(resolveResult);
    const SvgComponent = await getModuleContent(loadResult.contents);
    
    render(
      React.createElement(SvgComponent, {
        className: 'custom-class',
        'data-testid': 'icon-id',
      })
    );

    const svgElement = screen.getByTestId('icon-id');
    expect(svgElement).toBeInTheDocument();
    expect(svgElement.tagName.toLowerCase()).toBe('svg');
    expect(svgElement).toHaveClass('custom-class');

    const useElement = svgElement.querySelector('use');
    expect(useElement).not.toBeNull();
    expect(useElement.getAttribute('xlink:href')).toBe('#img.svg');
  });
});
