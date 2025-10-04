import React from 'react'


import Img2 from './assets/img2.svg?react';

import { Component } from './Component';

import './style.css';

export const App = () => {
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
