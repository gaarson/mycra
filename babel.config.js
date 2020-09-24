const buildMode = require('./config/buildMode');

const cssModulesScopedName = buildMode.isTest() 
  ? '[local]' 
  : '[local]___[hash:base64:5]';

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
    [
      require.resolve("babel-plugin-react-css-modules"),
      {
        generateScopedName: cssModulesScopedName,
        autoResolveMultipleImports: true
      }
    ]
  ]
}
