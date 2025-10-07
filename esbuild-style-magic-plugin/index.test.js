import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import esbuild from 'esbuild';

import { expect, describe } from '@jest/globals';
import { ast, print } from '@phenomnomnominal/tsquery';

import { changeStyleNameToClassName, styleMagicPlugin } from './';

const normalize = (code) => code.replace(/\s/g, '');

describe('changeStyleNameToClassName', () => {
  const modulesMap = {
    container: 'container_h_1',
    title: 'title_h_2',
    'is-active': 'is-active_h_3',
  };

  it('simple switch styleName to className', () => {
    const source = `const C = () => <div styleName="container" />;`;
    const expected = `const C = () => <div className="container_h_1"/>;`;
    
    const tsTree = ast(source);
    const { transformedTree } = changeStyleNameToClassName(tsTree, modulesMap);
    
    expect(normalize(print(transformedTree))).toBe(normalize(expected));
  });

  it('должен объединять styleName с существующим статическим className', () => {
    const source = `const C = () => <div className="existing" styleName="container title" />;`;
    const expected = `const C = () => <div className={["existing", "container_h_1 title_h_2"].filter(Boolean).join(" ")}/>;`;

    const tsTree = ast(source);
    const { transformedTree } = changeStyleNameToClassName(tsTree, modulesMap);

    expect(normalize(print(transformedTree))).toBe(normalize(expected));
  });

  it('должен объединять styleName с существующим динамическим className', () => {
    const source = `const C = () => <div className={getClasses()} styleName="container" />;`;
    const expected = `const C = () => <div className={[getClasses(), "container_h_1"].filter(Boolean).join(" ")}/>;`;
    
    const tsTree = ast(source);
    const { transformedTree } = changeStyleNameToClassName(tsTree, modulesMap);
    
    expect(normalize(print(transformedTree))).toBe(normalize(expected));
  });

  it('должен создавать хелпер для динамического styleName', () => {
    const source = `const C = () => <div styleName={isActive ? 'is-active' : ''} />;`;
    const expected = `const C = () => <div className={[_styleNameToClassNameHelper(STYLES, isActive ? 'is-active' : '')].filter(Boolean).join(" ")}/>;`;
    
    const tsTree = ast(source);
    const { transformedTree, needsHelper } = changeStyleNameToClassName(tsTree, modulesMap);
    
    expect(needsHelper).toBe(true);
    expect(normalize(print(transformedTree))).toBe(normalize(expected));
  });

  it('должен объединять динамический styleName и динамический className', () => {
    const source = `const C = () => <div className={getClasses()} styleName={isActive ? 'is-active' : ''} />;`;
    const expected = `const C = () => <div className={[getClasses(), _styleNameToClassNameHelper(STYLES, isActive ? 'is-active' : '')].filter(Boolean).join(" ")}/>;`;

    const tsTree = ast(source);
    const { transformedTree, needsHelper } = changeStyleNameToClassName(tsTree, modulesMap);

    expect(needsHelper).toBe(true);
    expect(normalize(print(transformedTree))).toBe(normalize(expected));
  });

  it('должен преобразовывать импорт стилей в side-effect import', () => {
    const source = `import styles from './style.css';\nimport React from 'react';\nconst C = () => <div styleName="container" />;`;
    
    const finalTree = ast(source);
    const result = changeStyleNameToClassName(finalTree, modulesMap);

    expect(print(result.transformedTree).trim()).toContain(`import './style.css';`);
  });
});

async function buildWithPluginOnDisk(files) {
  const tempDir = path.join(os.tmpdir(), `style-magic-test-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  try {
    for (const fileName in files) {
      const filePath = path.join(tempDir, fileName);
      const fileDir = path.dirname(filePath);
      await fs.mkdir(fileDir, { recursive: true });
      await fs.writeFile(filePath, files[fileName]);
    }

    const result = await esbuild.build({
      entryPoints: [path.join(tempDir, 'entry.tsx')],
      bundle: true,
      write: false,
      external: ['react'],
      plugins: [
        styleMagicPlugin(),
      ],
      absWorkingDir: process.cwd(),
    });
    
    return result.outputFiles[0].text;

  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

describe('styleMagicPlugin Integration Tests', () => {
  it('должен трансформировать один компонент и внедрить его стили', async () => {
    const files = {
      'entry.tsx': `
        import React from 'react';
        import './style.css';
        const App = () => <div styleName="title">Hello</div>;
        console.log(<App />); 
      `,
      'style.css': `.title { color: red; }`,
    };

    const output = await buildWithPluginOnDisk(files);

    expect(output).toMatch(/className:\s*".*title.*"/);

    expect(output).not.toContain('styleName');
    expect(output).toContain('style.textContent = `');
    expect(output).toContain('._title');
  });

  it('должен трансформировать вложенные компоненты и собрать все стили', async () => {
    const files = {
      'entry.tsx': `
        import React from 'react';
        import { App } from './App.tsx';
        console.log(<App />);
      `,
      'App.tsx': `
        import React from 'react';
        import { Component } from './Component.tsx';
        import './app-style.css';
        export const App = () => <div styleName="app-container"><Component /></div>;
      `,
      'app-style.css': `.app-container { padding: 10px; }`,
      'Component.tsx': `
        import React from 'react';
        import './component-style.scss';
        export const Component = () => <div styleName="comp-title">Title</div>;
      `,
      'component-style.scss': `.comp-title { font-size: 20px; }`,
    };

    const output = await buildWithPluginOnDisk(files);
    
    expect(output).toMatch(/className:\s*".*app-container.*"/);
    expect(output).toMatch(/className:\s*".*comp-title.*"/);
    
    expect(output).toContain('._app-container');
    expect(output).toContain('._comp-title');
  });

});
