const buildMode = require('./config/buildMode');

module.exports = {
  presets: [
  [
    require.resolve("@babel/preset-env"),
    { modules: false },
  ],
    require.resolve("@babel/preset-typescript"),
    require.resolve("@babel/preset-react"),
  ],
  plugins: [
    [
      require.resolve("@babel/plugin-proposal-decorators"),
      { "legacy": true }
    ],
    require.resolve("babel-plugin-parameter-decorator"),
    require.resolve("@babel/plugin-proposal-class-properties"),
    require.resolve('@babel/plugin-transform-typescript'),
    require.resolve("@babel/plugin-transform-modules-commonjs"),
    require.resolve("@babel/plugin-transform-runtime"),
    [
      require.resolve("babel-plugin-react-css-modules"),
      {
        "filetypes": {
          '.scss': {
            syntax: require.resolve('postcss-scss')
          }
        },
        generateScopedName: buildMode.simpleClassHash,
        autoResolveMultipleImports: true
      }
    ]
  ]
};
