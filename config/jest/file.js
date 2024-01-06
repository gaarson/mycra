import path from 'path';

export default {
  process(src, filename) {
    return {
      code: `module.exports = ${JSON.stringify(path.basename(filename))};`
    };
  },
}
