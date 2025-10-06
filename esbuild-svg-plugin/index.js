import fs from 'fs';
import path from 'path';
import fsExtra from 'fs-extra'

const svgs = {};

const svgSymbolsGenerator = (distDir) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="position: absolute; width: 0; height: 0" aria-hidden="true" id="__SVG_SPRITE_NODE__"><mask id="error_icon--react_mask0_12705_153069" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="1" y="3" width="14" height="14">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.00016 3.33337C4.32016 3.33337 1.3335 6.32004 1.3335 10C1.3335 13.68 4.32016 16.6667 8.00016 16.6667C11.6802 16.6667 14.6668 13.68 14.6668 10C14.6668 6.32004 11.6802 3.33337 8.00016 3.33337ZM8.00016 10.6667C7.6335 10.6667 7.3335 10.3667 7.3335 10V7.33337C7.3335 6.96671 7.6335 6.66671 8.00016 6.66671C8.36683 6.66671 8.66683 6.96671 8.66683 7.33337V10C8.66683 10.3667 8.36683 10.6667 8.00016 10.6667ZM7.3335 12V13.3334H8.66683V12H7.3335Z" fill="black"></path>
</mask>
  ${Object.keys(svgs).reduce((str, key) => {
    return str + `${svgs[key]
      .replace(/<svg\s+([^>]*\s)?width=['"][^'"]*['"]/, '<svg$1')
      .replace(/<svg\s+([^>]*\s)?height=['"][^'"]*['"]/, '<svg$1')
      .replace('<svg', `<symbol id="${key}"`)
      .replace('svg>', 'symbol>')}\n`;
  }, '')}
</svg>`;

  const content = `
    var div = document.createElement('div');
    div.innerHTML = decodeURI("${encodeURI(svg)}").trim();

    document.body.insertBefore(div.firstChild, document.body.firstChild)
  `

  if (fsExtra.existsSync(distDir)) {
    fs.writeFile(`${distDir}/svg-insert.js`, content, (err) => {
      if (err) {
        console.error(`Error writing file: ${err}`);
      }
    });
  } else {
    fs.mkdirSync(distDir);
    fs.writeFile(`${distDir}/svg-insert.js`, content, (err) => {
      if (err) {
        console.error(`Error writing file: ${err}`);
      }
    });
  }
}

const createOnLoad = (distDir, workDir) => async (args) => {
  let pathname = args.path;
  if (pathname.indexOf('?react') !== -1) {
    pathname = pathname.replace('?react', '');
  }
  let sourceCode = await fs.promises.readFile(pathname, 'utf8')
  const svgId = path.basename(pathname);
  svgs[svgId] = sourceCode;
  svgSymbolsGenerator(distDir);

  const contents = `
    const Icon = ({ className, glyph, ...restProps }) => {
      return React.createElement(
        'svg',
        { className, ...restProps }, 
        React.createElement('use', { xlinkHref: '#' + glyph })
      );
    };

    Icon.defaultProps = {
      glyph: '',
      className: 'icon'
    };

    export default (props) => <Icon glyph="${svgId}" {...props} />;
  `;

  return {
    contents,
    loader: 'jsx',
  }
}

export const mySvg = (workDir, distDir, isSplitSvg) => ({
  name: 'esbild-svg-my',
  setup(build) {
    if (isSplitSvg) {
      build.onResolve({ filter: /\.svg\?react$/ }, args => {
        return { path: path.join(args.resolveDir, args.path) };
      })
      build.onLoad({ filter: /\.svg\?react$/ }, createOnLoad(distDir))
    } else {
      build.onLoad({ filter: /\.svg$/ }, createOnLoad(distDir))
    }
  },
});
