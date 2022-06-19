const path = require('path');
const { stringifyRequest } = require('loader-utils');
const { stringifySymbol, stringify } = require('svg-sprite-loader/lib/utils');

module.exports = function runtimeGenerator({ symbol, config, context, loaderContext }) {
  const { spriteModule, symbolModule, runtimeOptions } = config;
  const compilerContext = loaderContext._compiler.context;

  const spriteRequest = stringifyRequest({ context }, spriteModule);
  const symbolRequest = stringifyRequest({ context }, symbolModule);
  const parentComponentDisplayName = 'SpriteSymbolComponent';

  return `
    import React from 'react';
    import SpriteSymbol from ${symbolRequest};
    import sprite from ${spriteRequest};
    
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

    const symbol = new SpriteSymbol(${stringifySymbol(symbol)});
    sprite.add(symbol);
    export default (props) => <Icon glyph="${symbol.id}" {...props} />;
  `;
};
