import React, { PureComponent } from 'react';

export default class Icon extends PureComponent {
  render() {
    const {className, glyph, ...restProps} = this.props;

    return React.createElement('svg', { className, ...restProps }, 
      React.createElement('use', { xlinkHref: `#${glyph}` })
    );
  }
}

Icon.defaultProps = {
  glyph: '',
  className: 'icon'
};
