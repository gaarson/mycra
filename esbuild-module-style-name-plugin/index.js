import fs from 'fs';
import fsExtra from 'fs-extra';
import path from 'path';
import postcss from 'postcss';
import cssModules from 'postcss-modules';
import * as esbuild from 'esbuild';
import ts from 'typescript';
import { ast, query, map, replace, print, match } from '@phenomnomnominal/tsquery';
import chokidar from 'chokidar';

const startWatching = (directoryPath, addCb, rmCb) => {
  var watcher = chokidar.watch(directoryPath, { ignored: /^\./, persistent: true });

  watcher.on('add', addCb).on('unlink', (path) => {
    if (rmCb) rmCb(path.replace(directoryPath, ''));
  }).on('error', (error) => {
    console.error('Error happened', error);
  })
}

const getCSSTemplate = (pathname) => {
  return new Promise((resolve, reject) => {
    fs.exists(pathname, function (exist) {

      if (exist) {
        if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;
        fs.readFile(pathname, 'utf8', function(err, data){
          if(err) {
            console.error('ERRORIK: ', err);
          } else {
            resolve(data);
          }
        });
      } else {
        startWatching(pathname, (newPath) => {
          if (fs.statSync(newPath).isDirectory()) newPath += '/index' + ext;
          fs.readFile(newPath, 'utf8', function(err, data){
            if(err) {
              console.error('ERRORSSSSSSSS: ', err);
            } else {
              resolve(data);
            }
          });
        })
      }
    });
  })
};

const getImportedCssFiles = async (tsTree, pathname, scopeGenerator) => {
  let filesMap = {};
  const cssImports = query(
    tsTree,
    'ImportDeclaration StringLiteral[value=/\.s?css$/]'
  );

  for (const astNode of cssImports) {
    const css = await getCSSTemplate(path.join(pathname, astNode.text));
    const res = await postcss([
      cssModules({ 
        generateScopedName: scopeGenerator,
        getJSON: function (cssFileName, json, outputFileName) {
          filesMap = {
            ...filesMap,
            ...json
          };
        },     
      })
    ]).process(css, { from: path.join(pathname, astNode.text) })
  }

  return filesMap;
}

const changeStyleNameToClassName = (tsTree, modulesMap) => {
  return map(tsTree, 'JsxAttribute[name.name=styleName]', (node) => {
    let styleNameExp = match(node.parent, 'JsxAttribute[name.name=styleName] JsxExpression')
    let styleNameString;// = match(node.parent, 'JsxAttribute[name.name=styleName] StringLiteral');

    if (!styleNameExp.length) {
      styleNameString = match(node.parent, 'JsxAttribute[name.name=styleName] StringLiteral');
      if (styleNameString.length) {
        styleNameString = `'${styleNameString[0].text.split(' ').map(s => modulesMap[s]).join(' ')}'`;
      } else {
        styleNameString = '';
      }
      styleNameExp = undefined;
    } else {
      styleNameExp = print(styleNameExp[0]);
      styleNameExp = `${styleNameExp ? styleNameExp.slice(1, -1) : ''}`;
    }

    const classNameString = match(node.parent, 'JsxAttribute[name.name=className] StringLiteral');

    if (classNameString.length) {
      node.parent = map(node.parent, 'JsxAttribute[name.name=className] StringLiteral', (classNameStringNode) => {
        classNameStringNode.text = `${classNameStringNode.text} ${styleNameString ? styleNameString.slice(1, -1) : styleNameExp}`
        return classNameStringNode;
      })
      return undefined;
    } else {
      const classNameExp = match(node.parent, 'JsxAttribute[name.name=className] JsxExpression');
      if (classNameExp.length) {
        node.parent = map(node.parent, 'JsxAttribute[name.name=className] JsxExpression', (classNameStringNode) => {
          let classNodeExpStr = print(classNameStringNode).slice(1, -1);
          let res;

          if (styleNameString) {
            res = '`${' + classNodeExpStr + '} ' + '${'+ styleNameString + '}`';
          }
          if (styleNameExp) {
            res = '`${' + classNodeExpStr + '} ' + "${("+ styleNameExp + " || '').trim().split(' ').map(s => JSON.parse('" + JSON.stringify(modulesMap) + "')[s]).join(' ')}`";
          }

          const express = match(ast(`<a t={${res}} />`), 'JsxExpression');
          classNameStringNode.expression = express[0].expression;

          return classNameStringNode;
        })
        return undefined;
      }
    }

    if (styleNameString) {
      const express = match(ast(`<div className=${styleNameString} />`), 'JsxAttribute[name]');
      print(express[0])
      return express[0];
    }

    node.name.escapedText = 'className';
    map(node, 'JsxExpression', (classNameNode) => {
      const express = match(ast(`<a t={${"`${("+ styleNameExp + " || '').trim().split(' ').map(s => JSON.parse('" + JSON.stringify(modulesMap) + "')[s]).join(' ')}`"}} />`), 'JsxExpression');
      classNameNode.expression = express[0].expression;

      return classNameNode;
    })

    return node;
  });
}

export const styleNamePlugin = (scopeGenerator) => ({
  name: 'styleNamePlugin',
  setup(build) {
    build.onLoad({ filter: /\.[jt]sx$/ }, async (args) => {
      const loader = path.extname(args.path).replace('.', '');
      let sourceCode = await fs.promises.readFile(args.path, 'utf8')
      const tree = ast(sourceCode);

      const modulesMap = await getImportedCssFiles(tree, path.dirname(args.path), scopeGenerator);
      const newSourceCode = changeStyleNameToClassName(tree, modulesMap);

      return { 
        contents: print(newSourceCode), 
        loader  
      }
    })
  },
})
