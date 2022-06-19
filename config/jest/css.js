module.exports = {
  process(data) {
    return {code: 'module.exports = {};'} ;
  },
  getCacheKey() {
    // The output is always the same.
    return 'cssTransform';
  },
};
