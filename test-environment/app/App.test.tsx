import React from 'react';
import renderer from 'react-test-renderer';
import {cleanup, fireEvent, render} from '@testing-library/react';
import { Component } from './Component';

it('some tests', () => {
  const component = renderer.create(
    <Component />,
  );
  const {getByText} = render(
    <Component />,
  );
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();

  // manually trigger the callback
  renderer.act(() => {
    tree.props.onMouseEnter();
  });
  // re-rendering
  tree = component.toJSON();
  expect(tree).toMatchSnapshot();

  // manually trigger the callback
  renderer.act(() => {
    tree.props.onMouseLeave();
  });
  // re-rendering
  tree = component.toJSON();
  expect(tree).toMatchSnapshot();
  
  console.log(getByText('po'));
  // expect(getByText(/pupik/i)).toBeTruthy();
});
