import React from 'react';
import ReactDOM from 'react-dom';
import { shallow } from 'enzyme';
import App from './App';

it('it renders', () => {
  const div = document.createElement('div');

  ReactDOM.render(<App text="some text" />, div);
  ReactDOM.unmountComponentAtNode(div);
});

it('app render text', () => {
  const app = shallow(<App text="some text" />);

  expect(app.find('#text').text()).toEqual('some text');
});
