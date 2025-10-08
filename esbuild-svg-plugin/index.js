import { promises as fs, readFileSync } from 'fs';
import path from 'path';
import fsExtra from 'fs-extra';

const generateSpriteAndInjector = async (svgs, distDir) => {
  const symbols = Object.entries(svgs)
    .map(([id, content]) => {
      return content
        .replace(/<svg\s+([^>]*\s)?width=['"][^'"]*['"]/, '<svg$1')
        .replace(/<svg\s+([^>]*\s)?height=['"][^'"]*['"]/, '<svg$1')
        .replace('<svg', `<symbol id="${id}"`)
        .replace('</svg>', '</symbol>');
    })
    .join('\n');

  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="position: absolute; width: 0; height: 0" aria-hidden="true" id="__SVG_SPRITE_NODE__">${symbols}</svg>`;
  
  const injectorContent = `
    (function() {
      if (document.getElementById('__SVG_SPRITE_NODE__')) return;
      var div = document.createElement('div');
      div.innerHTML = decodeURI("${encodeURI(sprite)}").trim();
      document.body.insertBefore(div.firstChild, document.body.firstChild);
    })();
  `;

  try {
    await fsExtra.ensureDir(distDir);
    console.log(distDir)
    await fs.writeFile(path.join(distDir, 'svg-insert.js'), injectorContent);
    return [];
  } catch (err) {
    return [{ text: 'Failed to write SVG sprite', detail: err }];
  }
};

export const mySvg = (_, distDir) => ({
  name: 'esbild-svg-my',
  setup(build) {
    const svgs = new Map();

    const createOnLoad = (args) => {
      const pathname = args.path.replace('?react', '');
      const svgId = path.basename(pathname);

      const sourceCode = readFileSync(pathname, 'utf8');
      svgs.set(svgId, sourceCode);

      const contents = `
        import React from 'react';
        
        const Icon = (props) => (
          <svg className={props.className || 'icon'} {...props}>
            <use xlinkHref={'#${svgId}'} />
          </svg>
        );

        export default Icon;
      `;

      return { contents, loader: 'jsx' };
    };

    build.onResolve({ filter: /\.svg\?react$/ }, args => {
      return {
        path: path.join(args.resolveDir, args.path),
      }
    });
    build.onLoad({ filter: /\.svg\?react$/ }, createOnLoad);

    build.onEnd(async (result) => {
      if (svgs.size > 0) {
        console.log(`[svg-sprite] Generating sprite with ${svgs.size} icons.`);
        const errors = await generateSpriteAndInjector(Object.fromEntries(svgs), distDir);
        if (errors.length > 0) {
          result.errors.push(...errors);
        }
        svgs.clear();
      }
    });
  },
});
