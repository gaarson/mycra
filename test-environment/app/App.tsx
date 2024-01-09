import React from 'react'

import style from './style.css';

import Img2 from './assets/img2.svg?react';

import { Component } from './Component';

export const App = () => {
  console.log('STYLEs', style, Img2);

  const countStyles = () => { return 'count' }

  return (
    <section>
      <Img2 styleName={countStyles()} />
      <div className="global-claas">a24111112</div>
      <div className="global-class" styleName="some-style"> aa HTLMWEF </div>
      <Component />
    </section>
  );
};
