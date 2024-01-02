import React from 'react'

import style from './style.css';

import { Component } from './Component';

export const App = () => {
  console.log('STYLEs', style);

  return (
    <section>
      <div className="global-claas">aaaaaaa</div>
      <div className="global-class" styleName="some-style"> aa HTLMWEF </div>
      <Component />
    </section>
  );
};
