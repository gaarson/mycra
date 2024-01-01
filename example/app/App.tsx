import React from 'react'

import style from './style.css';

export const App = () => {
  console.log('STYLEs', style);

  return (
    <section>
      <div>aaaaaaa</div>
      <div styleName="some-style"> aa HTLMWEF </div>
    </section>
  );
};
