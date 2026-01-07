import { promises as fs, readFileSync, existsSync } from 'fs';
import path from 'path';
import postcss from 'postcss';
import cssModules from 'postcss-modules';
import ts from 'typescript';
import * as csstree from 'css-tree';
import { fileURLToPath, pathToFileURL } from 'url';

import { ast, print, map, query } from '@phenomnomnominal/tsquery';

import dir from '../config/paths.js';

const styleNameRuntimeHelper = `
const _styleNameHelper = (styles, classNames) => {
  if (!classNames || typeof classNames !== 'string') return '';
  return classNames.trim().split(/\\s+/).map(name => styles[name] || name).join(' ');
};
`;

const sepTilde = `${path.sep}~`

function resolveImport(pathname, ext) {
  if (ext) {
    let filename = pathname + ext
    if (existsSync(filename)) {
      return filename
    }
    const index = filename.lastIndexOf(path.sep)
    filename = index >= 0 ? filename.slice(0, index) + path.sep + '_' + filename.slice(index + 1) : '_' + filename
    if (existsSync(filename)) {
      return filename
    }
    return null
  } else {
    if (!existsSync(path.dirname(pathname))) {
      return null
    }
    return resolveImport(pathname, '.scss')
      || resolveImport(pathname, '.css')
      || resolveImport(pathname, '.sass')
      || resolveImport(pathname + path.sep + 'index')
  }
}

function resolveRelativeImport(loadPath, filename) {
  const absolute = path.resolve(loadPath, filename)
  const pathParts = path.parse(absolute)
  if (/\.(s[ac]ss|css)$/.test(pathParts.ext)) {
    return resolveImport(pathParts.dir + path.sep + pathParts.name, pathParts.ext)
  } else {
    return resolveImport(absolute)
  }
}

export const getModule = async (moduleName, checkFunc) => {
  try {
    const module = await import(moduleName);
    if (typeof module[checkFunc] === 'function') return module;
    if (module.default && typeof module.default[checkFunc] === 'function') return module.default;
    throw new Error(`Func '${checkFunc}' not found for module '${moduleName}'`);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      throw new Error(`Missing module. Please install '${moduleName}' package.`);
    }
    throw e;
  }
};

function getFileFormat(filePath) {
  const ext = path.extname(filePath).slice(1);

  if (ext.toLowerCase().startsWith('jpg') 
    || ext.toLowerCase().startsWith('jpeg') 
    || ext.toLowerCase().startsWith('png')) return 'image';
  if (ext.toLowerCase().startsWith('ttg') 
    || ext.toLowerCase().startsWith('otf') 
    || ext.toLowerCase().startsWith('woff2') 
    || ext.toLowerCase().startsWith('woff')) return 'font';

  if (ext.toLowerCase().startsWith('gif')) return 'image/gif';
  if (ext.toLowerCase().startsWith('eot')) return 'application/vnd.ms-fontobject';
  if (ext.toLowerCase().startsWith('svg')) return 'svg+xml';

  return null; 
}

async function extractAndEmbedUrls(css, basedir) {
  const ast = csstree.parse(css);
  const urlNodesToProcess = [];

  csstree.walk(ast, (node) => {
    if (node.type === 'Url' && typeof node.value === 'string') {
      const urlValue = node.value; 
      
      if (urlValue.startsWith('./') || urlValue.startsWith('../')) {
        urlNodesToProcess.push({ node, urlValue });
      }
    }
  });

  await Promise.all(
    urlNodesToProcess.map(async ({ node, urlValue }) => {
      let fileName = path.basename(urlValue);
      const pathname = path.dirname(urlValue);

      if (fileName.includes('?')) fileName = fileName.split('?')[0];
      if (fileName.includes('#')) fileName = fileName.split('#')[0];

      const fullPath = path.join(basedir, pathname, fileName);
      const format = getFileFormat(fullPath);

      if (format) {
        try {
          const fileData = await fs.promises.readFile(fullPath);
          node.value = `data:${format};base64,${fileData.toString('base64')}`;
        } catch (err) {
          console.warn(`[style-plugin] Could not read file to embed: ${fullPath}`);
        }
      }
    })
  );

  return csstree.generate(ast);
}
function fileSyntax(filename) {
  if (filename.endsWith('.scss')) return 'scss';
  if (filename.endsWith('.css')) return 'css';
  return 'indented';
}

export const renderStyle = async (filePath, options) => {
  const { ext } = path.parse(filePath);
  const basedir = path.dirname(filePath);

  if (ext === '.css') {
    const css = await fs.readFile(filePath, 'utf-8');
    return extractAndEmbedUrls(css, basedir);
  }

  if (ext === '.sass' || ext === '.scss') {
    const sassOptions = options?.sassOptions || {};
    const sass = await getModule('sass', 'compile');
    
    const compiled = sass.compile(filePath, {
      ...sassOptions,
      quiedDeps: true,
      silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
      importers: [{
        canonicalize(url, ...rest) {
          let filename 
          if (url.startsWith('@'))  {
            filename = path.join(dir.app, url.replace('@', ''))
            const { ext } = path.parse(filename)
            if (!ext) return new URL(pathToFileURL(filename + '.sass'));
            return new URL(pathToFileURL(filename));
          }
          if (url.startsWith('file://')) {
            filename = fileURLToPath(url)
            let joint = filename.lastIndexOf(sepTilde)
            if (joint >= 0) {
              filename = resolveModule(filename.slice(joint + 2), filename.slice(0, joint))
            }
          } else {
            filename = decodeURI(url)
          }
          let resolved = resolveRelativeImport(basedir, filename)
          if (resolved) {
            return pathToFileURL(resolved)
          }
          return null
        },
        load(canonicalUrl) {
          const pathname = fileURLToPath(canonicalUrl)
          let contents = readFileSync(pathname, 'utf8')
          return {
            contents,
            syntax: fileSyntax(pathname),
          }
        },
      }],
      syntax: fileSyntax(filePath),
      style: options?.isMinify ? 'compressed' : 'expanded',
    });

    return extractAndEmbedUrls(compiled.css.toString(), basedir);
  }

  throw new Error(`Unsupported style format: '${ext}'`);
};

export function changeStyleNameToClassName(tsTree, modulesMap) {
  let needsHelper = false;

  const transformedTree = map(tsTree, 'JsxOpeningElement, JsxSelfClosingElement', (elementNode) => {
    const attributes = elementNode.attributes.properties;

    const styleNameAttr = attributes.find(
      (attr) =>
        ts.isJsxAttribute(attr) && (attr.name.escapedText === 'styleName' || attr.name.escapedText === 'stylename')
    );
    const classNameAttr = attributes.find(
      (attr) =>
        ts.isJsxAttribute(attr) && attr.name.escapedText === 'className'
    );

    if (!styleNameAttr) {
      return elementNode; 
    }

    needsHelper = true;

    const classParts = [];

    if (classNameAttr?.initializer) {
      if (ts.isStringLiteral(classNameAttr.initializer)) {
        classParts.push(classNameAttr.initializer);
      } else if (ts.isJsxExpression(classNameAttr.initializer) && classNameAttr.initializer.expression) {
        classParts.push(classNameAttr.initializer.expression);
      }
    }

    let styleNameExpression;
    if (!styleNameAttr.initializer || ts.isStringLiteral(styleNameAttr.initializer)) {
      styleNameExpression = styleNameAttr.initializer ?? ts.factory.createStringLiteral('');
    } else if (ts.isJsxExpression(styleNameAttr.initializer) && styleNameAttr.initializer.expression) {
      styleNameExpression = styleNameAttr.initializer.expression;
    } else {
      styleNameExpression = ts.factory.createStringLiteral('');
    }

    const helperCall = ts.factory.createCallExpression(
      ts.factory.createIdentifier('_styleNameHelper'),
      undefined,
      [
        ts.factory.createIdentifier('STYLES'), 
        styleNameExpression
      ]
    );
    classParts.push(helperCall);

    const newClassNameInitializer = ts.factory.createJsxExpression(
      undefined,
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createArrayLiteralExpression(classParts, true), 
              'filter'
            ),
            undefined,
            [ts.factory.createIdentifier('Boolean')]
          ),
          'join'
        ),
        undefined,
        [ts.factory.createStringLiteral(' ')]
      )
    );
    
    const newClassNameAttr = ts.factory.createJsxAttribute(
      ts.factory.createIdentifier('className'),
      newClassNameInitializer
    );

    const newAttributes = attributes.filter(
      attr => attr !== styleNameAttr && attr !== classNameAttr
    );
    newAttributes.push(newClassNameAttr);
    
    elementNode.attributes = ts.factory.updateJsxAttributes(elementNode.attributes, newAttributes);

    return elementNode;
  });

  const finalTree = map(transformedTree, 'ImportDeclaration:has(StringLiteral[value=/\\.(s?css|less)$/])', (node) => {
    node.importClause = undefined;
    return node;
  });

  return { transformedTree: finalTree, needsHelper };
}
export const styleMagicPlugin = (options = {}) => ({
  name: 'style-magic-plugin',
  
  setup(build) {
    const styleMagicNamespace = 'style-magic-ns';
    const modulesByPath = new Map();

    async function processCssFile(filePath, options) {
      if (modulesByPath.has(filePath)) {
        return modulesByPath.get(filePath);
      }

      let css = await renderStyle(filePath, options.cssOptions);
      let classMap = {};

      let result = { css };
      if (options?.cssOptions?.modulesExt.includes(path.extname(filePath))) {
        result = await postcss([
          cssModules({
            ...options.cssModulesOptions,
            getJSON: (_, json) => {
              classMap = json;
            },
          }),
        ]).process(css, { from: filePath });
      }
      
      const escapedCss = result.css.replace(/`/g, '\\`');
      const jsContent = `
        if (typeof document !== 'undefined') {
          let style = document.querySelector(\`style[data-path="${filePath}"]\`);
          if (!style) {
            style = document.createElement('style');
            style.setAttribute('data-path', '${filePath}');
            document.head.appendChild(style);
          }
          style.textContent = \`${escapedCss}\`;
        }
        export default ${JSON.stringify(classMap)};
      `;
      
      const processedResult = { classMap, jsContent };
      modulesByPath.set(filePath, processedResult);
      
      return processedResult;
    }

    build.onResolve({ filter: /\.[jt]sx?$/, namespace: 'file' }, (args) => {
        if (args.path.includes('node_modules')) {
            return;
        }

        return {
            path: path.resolve(args.resolveDir, args.path),
            namespace: styleMagicNamespace,
        };
    });

    build.onResolve({ filter: /.*/, namespace: styleMagicNamespace }, async (args) => {
        const cleanImporter = args.importer.startsWith(styleMagicNamespace + ':')
            ? args.importer.slice(styleMagicNamespace.length + 1)
            : args.importer;

        const resolveDir = cleanImporter 
            ? path.dirname(cleanImporter) 
            : process.cwd();

        const result = await build.resolve(args.path, {
            resolveDir: resolveDir,
            kind: args.kind,
        });

        if (result.errors.length > 0) {
            return { errors: result.errors };
        }

        if (/\.[jt]sx?$/.test(result.path) && !result.path.includes('node_modules')) {
            return {
                path: result.path,
                namespace: styleMagicNamespace,
            };
        }

        return { path: result.path, external: result.external };
    });

//     build.onResolve({ filter: /.*/, namespace: styleMagicNamespace }, async (args) => {
//         const cleanImporter = args.importer.startsWith(styleMagicNamespace + ':')
//             ? args.importer.slice(styleMagicNamespace.length + 1)
//             : args.importer;

//         const resolveDir = args.resolveDir 
//             ? args.resolveDir 
//             : (cleanImporter ? path.dirname(cleanImporter) : process.cwd());

//         const result = await build.resolve(args.path, {
//             resolveDir: resolveDir,
//             kind: args.kind,
//         });
//         if (result.errors.length > 0) {
//             return { errors: [{ text: `[plugin: style-magic-plugin] Could not resolve "${args.path}"` }] };
//         }

//         if (/\.[jt]sx?$/.test(result.path) && !result.path.includes('node_modules')) {
//             return {
//                 path: result.path,
//                 namespace: styleMagicNamespace,
//             };
//         }
        
//         return { path: result.path, external: result.external };
//     });

    build.onLoad({ filter: /\.(s[ac]ss|css)$/ }, async (args) => {
        const { jsContent } = await processCssFile(args.path, options);
        return { contents: jsContent, loader: 'js' };
    });

    build.onLoad({ filter: /.*/, namespace: styleMagicNamespace }, async (args) => {
        const sourceCode = await fs.readFile(args.path, 'utf8');
        const loader = args.path.endsWith('tsx') || args.path.endsWith('ts') ? 'tsx' : 'jsx';

        if (!sourceCode.toLowerCase().includes('stylename')) {
            return { 
              contents: sourceCode, loader, resolveDir: path.dirname(args.path), watchFiles: [args.path]
            };
        }

        const tsTree = ast(sourceCode, args.path);
        const styleImports = query(tsTree, 'ImportDeclaration:has(StringLiteral[value=/\\.(s?css|less)$/])');

        if (styleImports.length === 0) {
            return { contents: sourceCode, loader, resolveDir: path.dirname(args.path), watchFiles: [args.path] };
        }

        const resolvePromises = styleImports.map(node => {
            const importPath = node.moduleSpecifier.text;
            return build.resolve(importPath, {
                resolveDir: path.dirname(args.path),
                kind: 'import-statement',
            });
        });

        const resolvedResults = await Promise.all(resolvePromises);
        const componentModulesMap = {};

        const processPromises = resolvedResults.map(result => {
            if (!result.errors.length && result.path) {
                return processCssFile(result.path, options);
            }
        });
        
        const processedCssFiles = await Promise.all(processPromises);
        
        for (const result of processedCssFiles) {
            if (result && result.classMap) {
                Object.assign(componentModulesMap, result.classMap);
            }
        }

        if (Object.keys(componentModulesMap).length === 0) {
            return { contents: sourceCode, loader, resolveDir: path.dirname(args.path), watchFiles: [args.path] };
        }

        const { transformedTree, needsHelper } = changeStyleNameToClassName(tsTree, componentModulesMap);
        
        let contents = print(transformedTree);

        if (needsHelper) {
            const stylesVar = `const STYLES = ${JSON.stringify(componentModulesMap)};`;
            contents = `${styleNameRuntimeHelper}\n${stylesVar}\n${contents}`;
        }

        return {
            contents,
            loader,
            resolveDir: path.dirname(args.path),
            watchFiles: [args.path]
        };
    });
  }
});
