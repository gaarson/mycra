import esbuild from 'esbuild';
import path from 'path';
import { ast, print } from '@phenomnomnominal/tsquery';
import { changeStyleNameToClassName } from '../../esbuild-style-magic-plugin/index.js';

const styleNameRuntimeHelper = `
const _styleNameHelper = (styles, classNames) => {
  if (!classNames || typeof classNames !== 'string') return '';
  return classNames.trim().split(/\\s+/).map(name => styles[name] || name).join(' ');
};
const STYLES = new Proxy({}, {
  get: (target, prop) => prop
});
`;

const createTransformer = () => ({
  process(source, filename) {
    if (!/\.[jt]sx?$/.test(filename)) {
      return { code: source };
    }

    let code = source;
    if (source.includes('styleName')) {
      try {
        const tsTree = ast(source, filename);
        const { transformedTree, needsHelper } = changeStyleNameToClassName(tsTree, {});

        if (needsHelper) {
           code = styleNameRuntimeHelper + '\n' + print(transformedTree);
        }
      } catch (e) {
        console.warn(`[Jest Transformer] Failed to process styleName in ${filename}`, e);
      }
    }

    const ext = path.extname(filename);
    let loader = 'js';
    
    if (ext === '.tsx') {
        loader = 'tsx';
    } else if (ext === '.ts') {
        loader = 'ts';
    } else if (ext === '.jsx') {
        loader = 'jsx';
    } else {
        loader = 'jsx';
    }

    const { code: jsCode, map } = esbuild.transformSync(code, {
      loader, 
      format: 'cjs', 
      target: 'esnext',
      sourcemap: true,
      sourcefile: filename,
    });

    return { code: jsCode, map };
  },
});

export default createTransformer();
