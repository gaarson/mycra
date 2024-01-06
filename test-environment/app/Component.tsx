import React, { useState } from 'react';

import './Component.scss';

import './style.css';

import Svg from './assets/img.svg';

export const Component = () => {
  console.log('Svg', Svg);
  const [status, setStatus] = useState('normal');

  const onMouseEnter = () => {
    setStatus('hovered');
  };

  const onMouseLeave = () => {
    setStatus('normal');
  };

  const getS = () => { return 'get-style' }
  const getM = () => { return 'get-mc-style' }
  return (
    <article 
      className={status}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="alal" styleName="new-class class">
        po
      </div>
      <div styleName="new-class class">
        <div className={`${getS()}`} styleName={`${getS()} class ${
getM()
}`}>
          <p className="aa" styleName="class">
            pik
          </p>
        </div>
      </div>
    </article>
  );
}
