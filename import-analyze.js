// imports-analyze.js (v3 - с флагом для node_modules)
import fs from 'fs'
import path from 'path'
import parser from '@babel/parser'

/**
 * Загружает конфигурацию алиасов из tsconfig.json или jsconfig.json.
 */
function loadAliasConfig() {
  const projectRoot = process.cwd()
  const tsConfigPath = path.resolve(projectRoot, 'tsconfig.json')
  const jsConfigPath = path.resolve(projectRoot, 'jsconfig.json')

  let configPath = null
  if (fs.existsSync(tsConfigPath)) {
    configPath = tsConfigPath
  }
  else if (fs.existsSync(jsConfigPath)) {
    configPath = jsConfigPath
  }

  if (!configPath) {return null}

  try {
    let configFileContent = fs.readFileSync(configPath, 'utf-8')
    configFileContent = configFileContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
    const config = JSON.parse(configFileContent)
    const compilerOptions = config.compilerOptions
    if (compilerOptions && compilerOptions.baseUrl) {
      return {
        baseUrl: path.resolve(projectRoot, compilerOptions.baseUrl),
        paths: compilerOptions.paths || {},
      }
    }
  }
  catch (e) {
    console.error(`❌ Ошибка при парсинге файла конфигурации: ${configPath}`, e)
  }
  return null
}

/**
 * Классифицирует тип пути импорта для последующей сортировки.
 * @param {string} depPath - Путь импорта.
 * @returns {'external' | 'aliased' | 'relative'}
 */
function classifyDepPath(depPath) {
  if (depPath.startsWith('./') || depPath.startsWith('../')) {
    return 'relative'
  }
  if (!depPath.includes('/') || depPath.startsWith('@')) {
    return 'external'
  }
  return 'aliased'
}

/**
 * Рекурсивно анализирует файл и его зависимости.
 */
function analyzeFile(filePath, maxDepth, showCode, aliasConfig, includeNodeModules, currentDepth = 1, visited = new Set()) {
  if (currentDepth > maxDepth || visited.has(filePath)) return null
  visited.add(filePath)
    
  if (filePath.startsWith('node_modules:')) {
    return {
      filePath: filePath.replace('node_modules:', ''),
      dependencies: [],
    }
  }

  const supportedExtensions = /\.(js|jsx|ts|tsx)$/
  if (!supportedExtensions.test(filePath) && fs.existsSync(filePath)) {
    return {
      filePath: path.relative(process.cwd(), filePath),
      dependencies: [],
    }
  }

  let code
  try {
    code = fs.readFileSync(filePath, 'utf-8')
  }
  catch (error) {
    return {filePath, error: 'Не удалось прочитать файл', dependencies: []}
  }

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy'],
    })

    const fileDir = path.dirname(filePath)
        
    const allDepPaths = []
    ast.program.body.forEach(node => {
      if (node.type === 'ImportDeclaration') {
        allDepPaths.push(node.source.value)
      }
    })
        
    const sortedPaths = allDepPaths.sort((a, b) => {
      const typeA = classifyDepPath(a)
      const typeB = classifyDepPath(b)
      const order = {external: 0, aliased: 1, relative: 2}
      if (order[typeA] !== order[typeB]) {
        return order[typeA] - order[typeB]
      }
      return a.localeCompare(b)
    })

    const dependencies = []
    for (const depPath of sortedPaths) {
      const resolvedPath = resolveModulePath(fileDir, depPath, aliasConfig, includeNodeModules)
      if (resolvedPath) {
        // ИЗМЕНЕНИЕ: Прокидываем флаг `includeNodeModules` в рекурсивный вызов
        const dependencyTree = analyzeFile(resolvedPath, maxDepth, showCode, aliasConfig, includeNodeModules, currentDepth + 1, new Set(visited))
        if (dependencyTree) {
          dependencies.push(dependencyTree)
        }
      }
    }

    return {
      filePath: path.relative(process.cwd(), filePath),
      ...(showCode && {code}),
      dependencies,
    }
  }
  catch (e) {
    return {
      filePath: path.relative(process.cwd(), filePath),
      error: `Ошибка парсинга: ${e.message}`,
      dependencies: [],
    }
  }
}

/**
 * Преобразует путь импорта в абсолютный путь к файлу.
 */
function resolveModulePath(basePath, modulePath, aliasConfig, includeNodeModules) {
  if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
    const fullPath = path.resolve(basePath, modulePath)
    return findFileWithExtensions(fullPath)
  }

  if (aliasConfig) {
    for (const alias in aliasConfig.paths) {
      const aliasPattern = alias.replace('*', '(.*)')
      const regex = new RegExp(`^${aliasPattern}$`)
      const match = modulePath.match(regex)

      if (match) {
        for (const possiblePath of aliasConfig.paths[alias]) {
          const finalPath = path.resolve(aliasConfig.baseUrl, possiblePath.replace('*', match[1] || ''))
          const foundPath = findFileWithExtensions(finalPath)
          if (foundPath) return foundPath
        }
      }
    }
    const fullPathFromBase = path.resolve(aliasConfig.baseUrl, modulePath)
    const resolved = findFileWithExtensions(fullPathFromBase)
    if (resolved) return resolved
  }
    
  // ИЗМЕНЕНИЕ: Проверяем флаг, прежде чем вернуть внешнюю зависимость.
  if (includeNodeModules) {
    return `node_modules:${modulePath}`
  }

  // Если флаг не установлен, игнорируем зависимость
  return null
}

/**
 * Находит файл, пробуя добавить разные расширения.
 */
function findFileWithExtensions(fullPath) {
  const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts', '/index.tsx']
  for (const ext of extensions) {
    const pathWithExt = `${fullPath}${ext}`
    if (fs.existsSync(pathWithExt) && fs.statSync(pathWithExt).isFile()) {
      return pathWithExt
    }
  }
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath
  }
  return null
}

/**
 * Выводит дерево зависимостей в консоль.
 */
function printTree(node, prefix = '') {
  if (!node) return
  const isLast = prefix.endsWith('└─')
  const newPrefix = prefix.replace(isLast ? '└─' : '├─', '  ').replace(' ', '│')
  const errorText = node.error ? ` (❗️ Ошибка: ${node.error})` : ''
  console.log(`${prefix}${node.filePath}${errorText}`)
    
  if (node.code) {
    console.log(`${newPrefix}   ┌─ --- Код файла ---`)
    node.code.split('\n').forEach(line => console.log(`${newPrefix}   │ ${line}`))
    console.log(`${newPrefix}   └─ -----------------`)
  }

  if (node.dependencies && node.dependencies.length > 0) {
    node.dependencies.forEach((dep, index) => {
      const isLastDep = index === node.dependencies.length - 1
      printTree(dep, `${newPrefix}  ${isLastDep ? '└─' : '├─'} `)
    })
  }
}

/**
 * Главная функция.
 */
function main() {
  const aliasConfig = loadAliasConfig()
  const args = process.argv.slice(2)
  const targetFile = args.find(arg => !arg.startsWith('--'))

  if (!targetFile) {
    console.error('❌ Ошибка: Не указан файл для анализа. Пример: node imports-analyze.js src/index.js')
    return
  }

  const depthArg = args.find(arg => arg.startsWith('--depth='))
  const maxDepth = depthArg ? parseInt(depthArg.split('=')[1], 10) : 1
  const showCode = args.includes('--show-code')
  // ИЗМЕНЕНИЕ: Определяем, нужно ли включать `node_modules`. По умолчанию - `false`.
  const includeNodeModules = args.includes('--include-node-modules')
    
  console.log('')
  if (aliasConfig) {console.log(`✅ Конфигурация успешно загружена.`)}
  console.log(`🚀 Анализ файла: ${targetFile}`)
  console.log(`🌲 Максимальная глубина: ${maxDepth}`)
  console.log(`📦 Включить node_modules: ${includeNodeModules ? 'Да' : 'Нет (по умолчанию)'}`)
  console.log(`📄 Показывать код: ${showCode ? 'Да' : 'Нет'}\n`)

  const absolutePath = path.resolve(process.cwd(), targetFile)
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ Ошибка: Файл не найден по пути: ${absolutePath}`)
    return
  }

  // ИЗМЕНЕНИЕ: Передаем новый флаг в `analyzeFile`
  const dependencyTree = analyzeFile(absolutePath, maxDepth, showCode, aliasConfig, includeNodeModules)
  printTree(dependencyTree)
}

main()
