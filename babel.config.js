const buildMode = require('./config/buildMode');

const cssModulesScopedName = buildMode.isTest() 
  ? '[local]' 
  : '[local]___[hash:base64:7]';

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
        generateScopedName: cssModulesScopedName,
        autoResolveMultipleImports: true
      }
    ]
  ]
}
