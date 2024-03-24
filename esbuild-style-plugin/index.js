import fs, { promises } from 'fs';
import path from 'path';
import postcss from 'postcss';
import { createHash } from 'crypto';
import cssModules from 'postcss-modules';
import { fileURLToPath, pathToFileURL } from 'url'
import { minify } from 'minify';
import * as csstree from 'css-tree';
import dir from '../config/paths.js';

const fileFilter = /.\.(css|sass|scss|less|styl)$/
const LOAD_STYLE_NAMESPACE = 'LOAD_STYLE_NAMESPACE';
const SKIP_RESOLVE = 'SKIP_RESOLVE';

const resolveModule = (id, basedir) => {
  const opts = { paths: ['.'] };
  try {
    opts.paths[0] = basedir
    let resolved = require.resolve(id, opts)
    // pretty ugly patch to avoid resolving erroneously to .js files ///////////////////////////////////////////////
    if (resolved.endsWith('.js')) {
      resolved = resolved.slice(0, -3) + '.scss'
      if (!existsSync(resolved)) {
        resolved = resolved.slice(0, -5) + '.sass'
        if (!existsSync(resolved)) {
          resolved = resolved.slice(0, -5) + '.css'
        }
      }
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    return resolved
  } catch (ignored) {
    return id
  }
};

function resolveImport(pathname, ext) {
  if (ext) {
    let filename = pathname + ext
    if (fs.existsSync(filename)) {
      return filename
    }
    const index = filename.lastIndexOf(path.sep)
    filename = index >= 0 ? filename.slice(0, index) + path.sep + '_' + filename.slice(index + 1) : '_' + filename
    if (fs.existsSync(filename)) {
      return filename
    }
    return null
  } else {
    if (!fs.existsSync(path.dirname(pathname))) {
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
const sepTilde = `${path.sep}~`

export const getModule = async (moduleName, checkFunc) => {
  try {
    const module = await import(moduleName)
    if (typeof module[checkFunc] === `function`) return module
    if (typeof module.default[checkFunc] === `function`) return module.default
    throw new Error(`Func '${checkFunc}' not found for module '${moduleName}'`)
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      throw new Error(`Missing module. Please install '${moduleName}' package.`)
    } else {
      throw e
    }
  }
}

const handleCSSModules = (mapping, cssModulesOptions) => {
  const _getJSON = cssModulesOptions.getJSON

  return cssModules({
    ...cssModulesOptions,
    getJSON: (cssFilename, json, outputFilename) => {
      if (typeof _getJSON === 'function') _getJSON(cssFilename, json, outputFilename)
      mapping.data = JSON.stringify(json, null, 2)
    }
  })
}
function fileSyntax(filename) {
  if (filename.endsWith('.scss')) return 'scss';
  else if (filename.endsWith('.css')) return 'css'; 
  else return 'indented';
}
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

  return null; // Unknown format
}

function extractAndChangeUrls(css, filePath) {
  const ast = csstree.parse(css);
  csstree.walk(ast, (node) => {
    if (node.type === 'Url') {
      const file = node.value;
      if (file.startsWith('/') || file.startsWith('../') || file.startsWith('./')) {
        let fileName = path.basename(file);
        const pathname = path.dirname(file)
        
        if (fileName.indexOf('?') !== -1) fileName = fileName.split('?')[0];
        if (fileName.indexOf('#') !== -1) fileName = fileName.split('#')[0];
        const fullPath = path.join(filePath, pathname, fileName)

        const format = getFileFormat(fullPath);

        if (format) {
          const fileData = fs.readFileSync(fullPath);
          node.value = `data:${format};base64,${fileData.toString('base64')}`;
        }
      }
    }
  });
  return csstree.generate(ast);
}

export const renderStyle = async (filePath, options) => {
  const { ext } = path.parse(filePath)

  const basedir = path.dirname(filePath)
  if (ext === '.css') {
    if (options.isMinify) {
      try {
        const css = await minify(filePath, {})
        const parsedCss = extractAndChangeUrls(res, basedir);
        return res;
      } catch (error) {
        return (await promises.readFile(filePath)).toString();
      }
    }
    const css = (await promises.readFile(filePath)).toString();
    const parsedCss = extractAndChangeUrls(css, basedir);
    return parsedCss;
  }

  if (ext === '.sass' || ext === '.scss') {
    const sassOptions = options.sassOptions || {}
    let source = await promises.readFile(filePath, 'utf-8')

    const sass = await getModule('sass', 'compile');
    const compiled = sass.compile(filePath, { 
      ...sassOptions,
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
          let contents = fs.readFileSync(pathname, 'utf8')
          return {
            contents,
            syntax: fileSyntax(pathname),
            // sourceMapUrl: buildMode.isProduct() ? canonicalUrl : undefined
          }
        }
      }],
      syntax: fileSyntax(filePath),
      style: options.isMinify ? 'compressed' : 'expanded' 
    }
  );

    const parsedCss = extractAndChangeUrls(compiled.css.toString(), basedir);

    // console.log('PARSED CSS', parsedCss);
    return parsedCss; 
  }

  throw new Error(`Can't render this style '${ext}'.`)
}

const onStyleResolve = (isRaw) => async (build, args) => {
  const { namespace } = args

  if (args.pluginData === SKIP_RESOLVE || namespace === LOAD_STYLE_NAMESPACE) return

  const result = await build.resolve(args.path, { resolveDir: args.resolveDir, pluginData: SKIP_RESOLVE, kind: args.kind })
  if (result.errors.length > 0) {
    return { errors: result.errors }
  }

  const fullPath = result.path

  // Check for pre compiled JS files like file.css.js
  if (!fileFilter.test(fullPath)) return

  return {
    path: fullPath,
    namespace: LOAD_STYLE_NAMESPACE,
    watchFiles: [fullPath],
    pluginData: { isRaw }
  }
}

export const getPostCSSWatchFiles = (result) => {
  let watchFiles = []
  const { messages } = result
  for (const message of messages) {
    const { type } = message
    if (type === 'dependency') {
      watchFiles.push(message.file)
    } else if (type === 'dir-dependency') {
      if (!message.dir) continue

      // Can be translated to const globString = message.glob ?? `**/*` but we will use code bellow to support node12
      // https://node.green/#ES2020-features--nullish-coalescing-operator-----
      let globString = `**/*`
      if (message.glob && message.glob !== '') globString = message.glob

      const globPath = path.join(message.dir, globString)
      const files = globSync(globPath)
      watchFiles = [...watchFiles, ...files]
    }
  }
  return watchFiles
}

const onStyleLoad = (options, build) => async (args) => {
  const extract = options.extract === undefined ? true : options.extract
  const cssModulesOptions = options.cssModulesOptions || {}
  const renderOptions = options.renderOptions

  let css = await renderStyle(args.path, { ...renderOptions, isMinify: build.initialOptions.minify })

  let watchFiles = []
  let mapping = { data: {} }
  let { plugins = [], ...processOptions } = options.postcss || {}
  let injectMapping = false
  let contents = ''
  const { ext } = path.parse(args.path)

  if (!args.pluginData?.isRaw && ext !== '.sass') {
    plugins = [handleCSSModules(mapping, cssModulesOptions), ...plugins]
    injectMapping = true
  }

  if (plugins.length > 0) {
    const result = await postcss(plugins).process(css, { ...processOptions, from: args.path })
    css = result.css

    watchFiles = [...watchFiles, ...getPostCSSWatchFiles(result)]

    if (injectMapping) contents += `export default ${mapping.data};`
  }

  if (extract) {
    contents += `
      (document.head || document.getElementsByTagName('head')[0]).insertAdjacentHTML("beforeend", decodeURI("${'<style>' + encodeURI(`/*${args.path}*/\n${css}`) + '</style>'}"))
`
  } 

  return {
    watchFiles,
    resolveDir: path.dirname(args.path), // Keep resolveDir for onTempLoad anything resolve inside temp file must be resolve using source dir
    contents: contents,
    pluginData: css
  }
}

export const stylePerPlugin = (options) => ({
  name: 'esbuild-per-style-plugin',
  setup: async (build) => {
    build.onResolve({ filter: /.\.(css|sass|scss|less|styl)\?raw/ }, onStyleResolve(true).bind(null, build));
    build.onResolve({ filter: fileFilter }, onStyleResolve().bind(null, build))

    build.onLoad({ filter: /.*/, namespace: LOAD_STYLE_NAMESPACE }, onStyleLoad(options, build))
  }
})
