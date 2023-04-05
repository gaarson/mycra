process.env.NODE_ENV = 'production';

const path = require('path');
const args = require('../utils/args');
const dir = require('../config/paths');
const { sassPlugin } = require('esbuild-sass-plugin');
const svgr = require('esbuild-plugin-svgr');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const envFilePlugin = require('esbuild-envfile-plugin');

require('esbuild').build({
  entryPoints: [`${dir.app}/index.tsx`],
  bundle: true,
  outdir: dir.dist,
  define: {'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')},
  plugins: [
    sassPlugin({ cssImports: true }),
    svgr(),
    envFilePlugin
    // nodeExternalsPlugin()
  ],
  loader: {
    '.png': 'dataurl',
    '.woff': 'dataurl',
    '.woff2': 'dataurl',
    '.eot': 'dataurl',
    '.ttf': 'dataurl',
    '.svg': 'dataurl',
  },
}).catch((error) => {
  console.log('Error', error);
  process.exit(1)
})
