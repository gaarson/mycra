// @flow
import React from 'react';

import './App.styl';

const App = ({ text }: { text: string }) => (
  <div>
    <p>
      React app Init
    </p>
    <p id="text">
      {text}
    </p>
  </div>
);

export default App;
