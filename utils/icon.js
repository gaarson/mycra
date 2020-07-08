import React from 'react';

const Icon = ({ className, glyph, ...restProps }) => {
  return React.createElement(
    'svg', 
    { className, ...restProps }, 
    React.createElement('use', { xlinkHref: `#${glyph}` })
  );
};

Icon.defaultProps = {
  glyph: '',
  className: 'icon'
};

export default Icon;
