import React from 'react'

import Img2 from './assets/img2.svg?react';

import { Component } from './Component';

import './style.css';

export const App = () => {
  const countStyles = () => { return 'count' }
  const classStyles = () => { return 'class' }

  return (

    <section>
      <Img2 className={classStyles()} styleName={countStyles()} />
      <div className="global-claas">12aaaaa12</div>
      <div className="global-class" styleName="some-style"> aa HTLMWEF </div>

      <Component />
    </section>
  );
};
