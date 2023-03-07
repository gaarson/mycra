const React = require('package-mock');
const { watcherCreator } = require('repka/watcher');
console.log(React);
if (!window.deps) {
  window.deps = watcherCreator(React);
}
module.exports = window.deps.sourceObj;
