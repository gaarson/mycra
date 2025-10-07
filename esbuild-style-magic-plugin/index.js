import { promises as fs, readFileSync } from 'fs';
import path from 'path';
import postcss from 'postcss';
import cssModules from 'postcss-modules';
import ts from 'typescript';
import * as csstree from 'css-tree';
import { fileURLToPath, pathToFileURL } from 'url';

import { ast, print, map, query } from '@phenomnomnominal/tsquery';

import dir from '../config/paths.js';

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

async function extractAndEmbedUrls(css, basedir) {
  const ast = csstree.parse(css);
  const urlNodesToProcess = [];

  csstree.walk(ast, (node) => {
    // Проверяем, что это узел Url и его значение - это строка
    if (node.type === 'Url' && typeof node.value === 'string') {
      const urlValue = node.value; // Просто берем значение как есть
      
      // Если это относительный путь, добавляем в очередь
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
          // Просто присваиваем новую строку прямо в node.value
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
  return 'indented'; // for .sass
}

export const renderStyle = async (filePath, options) => {
  const { ext } = path.parse(filePath);
  const basedir = path.dirname(filePath);

  if (ext === '.css') {
    const css = await fs.readFile(filePath, 'utf-8');
    // [REFAC] Убрана закомментированная и неработающая логика с minify
    return extractAndEmbedUrls(css, basedir);
  }

  if (ext === '.sass' || ext === '.scss') {
    const sassOptions = options?.sassOptions || {};
    const sass = await getModule('sass', 'compile');
    
    // [REFAC] API sass.compile является синхронным, поэтому внутренние резолверы тоже
    const compiled = sass.compile(filePath, {
      ...sassOptions,
      importers: [{
        canonicalize(url) {
          if (url.startsWith('@')) {
            const filename = path.join(dir.app, url.substring(1));
            return pathToFileURL(filename);
          }
          // [REFAC] Логика разрешения `~` (node_modules) упрощена.
          // Для более сложных случаев лучше использовать `enhanced-resolve`
          if (url.startsWith('~')) {
              // Note: this is a simplified node_modules resolver
              return pathToFileURL(require.resolve(url.substring(1), { paths: [basedir] }));
          }
          const resolved = resolveRelativeImportSync(basedir, decodeURI(url));
          return resolved ? pathToFileURL(resolved) : null;
        },
        load(canonicalUrl) {
          const pathname = fileURLToPath(canonicalUrl);
          const contents = readFileSync(pathname, 'utf8');
          return {
            contents,
            syntax: fileSyntax(pathname),
          };
        },
      }],
      syntax: fileSyntax(filePath),
      style: options?.isMinify ? 'compressed' : 'expanded',
    });

    return extractAndEmbedUrls(compiled.css.toString(), basedir);
  }

  throw new Error(`Unsupported style format: '${ext}'`);
};

const styleNameHelper = `
const _styleNameToClassNameHelper = (styles, classNames) => {
  if (!classNames || typeof classNames !== 'string') return '';
  return classNames.trim().split(/\\s+/).map(name => styles[name] || name).join(' ');
};
`;
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

    const classParts = [];

    if (classNameAttr?.initializer) {
      if (ts.isStringLiteral(classNameAttr.initializer)) {
        // className="static-class"
        classParts.push(classNameAttr.initializer);
      } else if (ts.isJsxExpression(classNameAttr.initializer) && classNameAttr.initializer.expression) {
        // className={dynamicExpression}
        classParts.push(classNameAttr.initializer.expression);
      }
    }

    if (styleNameAttr.initializer) {
        if (ts.isStringLiteral(styleNameAttr.initializer)) {
            const staticClasses = styleNameAttr.initializer.text
              .trim()
              .split(/\s+/)
              .map(name => modulesMap[name] || name)
              .join(' ');
      
            if (staticClasses) {
              classParts.push(ts.factory.createStringLiteral(staticClasses));
            }
          } else if (ts.isJsxExpression(styleNameAttr.initializer) && styleNameAttr.initializer.expression) {
            needsHelper = true;
            const helperCall = ts.factory.createCallExpression(
              ts.factory.createIdentifier('_styleNameToClassNameHelper'),
              undefined,
              [
                ts.factory.createIdentifier('STYLES'),
                styleNameAttr.initializer.expression,
              ]
            );
            classParts.push(helperCall);
          }
    }
    
    if (classParts.length === 0) {
        elementNode.attributes = ts.factory.updateJsxAttributes(elementNode.attributes, 
            attributes.filter(attr => attr !== styleNameAttr && attr !== classNameAttr)
        );
        return elementNode;
    }

    let newClassNameInitializer;

    if (classParts.length === 1 && ts.isStringLiteral(classParts[0])) {
      newClassNameInitializer = classParts[0];
    } else {
      newClassNameInitializer = ts.factory.createJsxExpression(
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
    }

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

  const treeWithoutCssImports = map(transformedTree, 'ImportDeclaration:has(StringLiteral[value=/\\.(s?css|less)$/])', (node) => {
      node.importClause = undefined;
      return node;
  });

  return { transformedTree: treeWithoutCssImports, needsHelper };
}

export const styleMagicPlugin = (options = {}) => ({
  name: 'style-magic-plugin',
  
  setup(build) {
    const styleMagicNamespace = 'style-magic-ns';
    const modulesByPath = new Map();

    async function processCssFile(filePath, options) {
      // Если мы уже обрабатывали этот файл, возвращаем результат из кэша
      if (modulesByPath.has(filePath)) {
        return modulesByPath.get(filePath);
      }

      const css = await renderStyle(filePath, options.renderOptions);
      let classMap = {};
      
      const result = await postcss([
        cssModules({
          ...options.cssModulesOptions,
          getJSON: (cssFilename, json) => {
            classMap = json;
          },
        }),
      ]).process(css, { from: filePath });
      
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

    build.onResolve({ filter: /\.[jt]sx$/, namespace: 'file' }, (args) => {
        if (args.path.includes('node_modules')) {
            return;
        }

        return {
            path: path.resolve(args.resolveDir, args.path),
            namespace: styleMagicNamespace,
        };
    });

    build.onResolve({ filter: /.*/, namespace: styleMagicNamespace }, async (args) => {
        // Определяем, является ли импорт пакетным (не начинается с точки или слеша)
        const isPackageImport = !args.path.startsWith('.') && !path.isAbsolute(args.path);

        // В зависимости от типа импорта выбираем правильную директорию для поиска
        const resolveDir = isPackageImport
            ? process.cwd() // Для пакетов ищем от корня проекта (где node_modules)
            : path.dirname(args.importer); // Для относительных файлов - рядом с импортером

        const result = await build.resolve(args.path, {
            resolveDir: resolveDir,
            kind: args.kind,
            // Добавим importer для большей точности
            importer: args.importer, 
        });

        if (result.errors.length > 0) {
            // Оборачиваем ошибку для более ясного вывода в тестах
            return { errors: [{ text: `[plugin: style-magic-plugin] Could not resolve "${args.path}"` }] };
        }

        if (/\.[jt]sx$/.test(result.path) && !result.path.includes('node_modules')) {
            return {
                path: result.path,
                namespace: styleMagicNamespace,
            };
        }
        
        return { path: result.path, external: result.external };
    });

    build.onLoad({ filter: /\.(s[ac]ss|css)$/ }, async (args) => {
        const { jsContent } = await processCssFile(args.path, options);
        return { contents: jsContent, loader: 'js' };
    });

    build.onLoad({ filter: /.*/, namespace: styleMagicNamespace }, async (args) => {
        const sourceCode = await fs.readFile(args.path, 'utf8');
        const loader = args.path.endsWith('tsx') ? 'tsx' : 'jsx';

        if (!sourceCode.toLowerCase().includes('stylename')) {
            return { contents: sourceCode, loader, resolveDir: path.dirname(args.path) };
        }

        const tsTree = ast(sourceCode, args.path);
        const styleImports = query(tsTree, 'ImportDeclaration:has(StringLiteral[value=/\\.(s?css|less)$/])');

        if (styleImports.length === 0) {
            return { contents: sourceCode, loader, resolveDir: path.dirname(args.path) };
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
            return { contents: sourceCode, loader, resolveDir: path.dirname(args.path) };
        }

        const { transformedTree, needsHelper } = changeStyleNameToClassName(tsTree, componentModulesMap);
        let contents = print(transformedTree);

        if (needsHelper) {
            const stylesVar = `const STYLES = ${JSON.stringify(componentModulesMap)};`;
            contents = `${styleNameHelper}\n${stylesVar}\n${contents}`;
        }

        return {
            contents,
            loader,
            resolveDir: path.dirname(args.path),
        };
    });
  }
});
