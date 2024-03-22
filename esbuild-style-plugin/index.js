import { promises as fs } from 'fs';
import path from 'path';
import postcss from 'postcss';
import { createHash } from 'crypto';
import cssModules from 'postcss-modules';
import url from 'url';
import { minify } from 'minify';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const styleFilter = /.\.(css|sass|scss|less|styl)$/
const LOAD_STYLE_NAMESPACE = 'stylePlugin'
const SKIP_RESOLVE = 'esbuild-style-plugin-skipResolve'

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
export const renderStyle = async (filePath, options) => {
  const { ext } = path.parse(filePath)

  if (ext === '.css') {
    if (options.isMinify) {
      try {
        const res = await minify(filePath, {})
        return res;
      } catch (error) {
        return (await fs.readFile(filePath)).toString();
      }
    }
    return (await fs.readFile(filePath)).toString()
  }

  if (ext === '.sass' || ext === '.scss') {
    const sassOptions = options.sassOptions || {}
    const sass = await getModule('sass', 'compile')
    return sass.compile(filePath, { ...sassOptions, style: options.isMinify ? 'compressed' : 'expanded' }).css.toString()
  }

  throw new Error(`Can't render this style '${ext}'.`)
}

const onStyleResolve = async (build, args) => {
  const { namespace } = args

  if (args.pluginData === SKIP_RESOLVE || namespace === LOAD_STYLE_NAMESPACE) return

  const result = await build.resolve(args.path, { resolveDir: args.resolveDir, pluginData: SKIP_RESOLVE, kind: args.kind })
  if (result.errors.length > 0) {
    return { errors: result.errors }
  }

  const fullPath = result.path

  // Check for pre compiled JS files like file.css.js
  if (!styleFilter.test(fullPath)) return

  return {
    path: fullPath,
    namespace: LOAD_STYLE_NAMESPACE,
    watchFiles: [fullPath]
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
  const cssModulesMatch = options.cssModulesMatch || /\.module\./
  const isCSSModule = args.path.match(cssModulesMatch)
  const cssModulesOptions = options.cssModulesOptions || {}
  const renderOptions = options.renderOptions

  let css = await renderStyle(args.path, { ...renderOptions, isMinify: build.initialOptions.minify })

  let watchFiles = []
  let mapping = { data: {} }
  let { plugins = [], ...processOptions } = options.postcss || {}
  let injectMapping = false
  let contents = ''

  if (isCSSModule) {
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
    if (options.postcssConfigFile) {
      console.log(`Using postcss config file.`)
      options.postcss = await importPostcssConfigFile(options.postcssConfigFile)
    }

    // Resolve all css or other style here
    build.onResolve({ filter: /.\.(css|sass|scss|less|styl)\?raw/ }, onStyleResolve.bind(null, build));
    build.onResolve({ filter: styleFilter }, onStyleResolve.bind(null, build))
    // build.onResolve({ filter: /^ni:/, namespace: LOAD_STYLE_NAMESPACE }, onTempStyleResolve.bind(null, build))

    // // New temp files from rendered css must be evaluated
    // build.onLoad({ filter: /.*/, namespace: LOAD_TEMP_NAMESPACE }, onTempLoad)

    // // Render css with CSS Extensions / Preprocessors and PostCSS
    build.onLoad({ filter: /.*/, namespace: LOAD_STYLE_NAMESPACE }, onStyleLoad(options, build))
  }
})
