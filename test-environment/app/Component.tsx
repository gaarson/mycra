import React from 'react';

import './Component.scss';

import './style.css';

import Svg from './assets/img.svg';

export const Component = () => {
  console.log('Svg', Svg);
  const getS = () => { return 'get-style' }
  const getM = () => { return 'get-mc-style' }
  return (
    <article styleName={getM()}>
      <img className={getS()} styleName="image count" src={Svg} />
      <div className="alal" styleName="new-class class">
        Component
      </div>
      <div styleName="new-class class">
        <div className={`${getS()}`} styleName={`${getS()} class ${
getM()
}`}>
          <p className="aa" styleName="class">
            afas
          </p>
        </div>
        Component
      </div>
    </article>
  );
}
