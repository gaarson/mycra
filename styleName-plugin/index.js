import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import cssModules from 'postcss-modules';
import ts from 'typescript';
import { ast, query, map, replace, print } from '@phenomnomnominal/tsquery';

const getCSSTemplate = (pathname) => {
  return new Promise((resolve, reject) => {
    fs.exists(pathname, function (exist) {
      if(!exist) {
        // if the file is not found, return 404
        console.error('File doesn`t exists');
        reject();
      }

      // if is a directory search for index file matching the extension
      if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

      // read file from file system
      fs.readFile(pathname, 'utf8', function(err, data){
        if(err){
          console.error('ERROR: ', err);
        } else {
          // console.log('DATA', data);
          resolve(data);
          // if the file is found, set Content-type and send data
        }
      });
    });
  })
};

const getImportedCssFiles = async (tsTree, pathname, scopeGenerator) => {
  let filesMap = {};
  const cssImports = query(
    tsTree,
    'ImportDeclaration StringLiteral[value=/\.s?[ca]ss$/]'
  );

  for (const astNode of cssImports) {
    console.log(path.join(pathname, astNode.text));
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

const changeStyleNametoClassName = (tsTree, modulesMap) => {
  let isClassNameExists = false;
  let newTree;
  newTree = map(tsTree, 'JsxAttribute[name.name=styleName]', (node) => {
    // console.log('NODE', node);
    const valuesNode = node.initializer.text.split(' ');

    map(node.parent, 'JsxAttribute Identifier', (classNameNode) => {
      if (classNameNode.escapedText === 'className') {
        isClassNameExists = true;
        if (classNameNode.parent.initializer.text) {
          classNameNode.parent.initializer.text = `${classNameNode.parent.initializer.text} ${valuesNode.map(s => modulesMap[s]).join(' ')}`;
        }
      }
      return classNameNode
    });

    if (!isClassNameExists) {
      node.name.escapedText = 'className';
      node.initializer.text = valuesNode.map(s => modulesMap[s]).join(' ');
      return node;
    } else {
      return undefined;//  ts.factory.createJsxAttribute('')
    }

    return node;
  });

  return newTree;
}

export const styleNamePlugin = (scopeGenerator) => ({
  name: 'styleNamePlugin',
  setup(build) {
    // Load ".txt" files and return an array of words
    build.onLoad({ filter: /\.[jt]sx$/ }, async (args) => {
      const loader = path.extname(args.path).replace('.', '');
      let sourceCode = await fs.promises.readFile(args.path, 'utf8')
      const tree = ast(sourceCode);

      const modulesMap = await getImportedCssFiles(tree, path.dirname(args.path), scopeGenerator);
      console.log('filesMap', modulesMap);
      const newSourceCode = changeStyleNametoClassName(tree, modulesMap);

      console.log(print(newSourceCode));

      return { 
        contents: print(newSourceCode), 
        loader  
      }
    })
  },
})
