const buildMode = require('./config/buildMode');
const args = require('./utils/args');

const cssModulesScopedName = buildMode.isTest() 
  ? '[local]' 
  : '[local]___[hash:base64:5]';

const libraryPresets = args.library === 'react' 
  ? [
    [
      require.resolve("@babel/preset-env"),
      { modules: false },
    ],
    require.resolve("@babel/preset-typescript"),
    require.resolve("@babel/preset-react"),
  ] : [
    require.resolve("@babel/preset-env"),
    require.resolve("@babel/preset-typescript"),
  ];

const libraryPlugins = args.library === 'react' 
  ? [
    require.resolve("@babel/plugin-transform-modules-commonjs"),
    require.resolve("@babel/plugin-transform-runtime"),
    [
      require.resolve("babel-plugin-react-css-modules"),
      {
        generateScopedName: cssModulesScopedName,
        autoResolveMultipleImports: true
      }
    ]
  ] : [
    require.resolve("@glimmer/babel-plugin-glimmer-env"),
    require.resolve("@glimmer/babel-plugin-strict-template-precompile"),
    require.resolve("@glimmerx/babel-plugin-component-templates"),
    [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
    require.resolve('@babel/plugin-proposal-class-properties'),
  ]


module.exports = {
  presets: libraryPresets,
  plugins: libraryPlugins
}
