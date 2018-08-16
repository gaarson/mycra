/* eslint-disable */
const Enzyme = require('enzyme');
const Adapter  = require('enzyme-adapter-react-16');
require('jest-localstorage-mock');
/* eslint-disable */

Enzyme.configure({ adapter: new Adapter() });
