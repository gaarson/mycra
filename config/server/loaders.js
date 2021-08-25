const path = require('path');
const buildMode = require('../buildMode');
const babelOptions = require('../../babel.serverConfig');

const environment = buildMode.type || 'development';
const cssLoaderConfig = require('./css-loader')[environment];

// const babelrc = buildMode.isDevelop();
const allowReturnOutsideFunction = buildMode.isDevelop();
const sassSourceMap = buildMode.isDevelop();

const loaders = [
  {
    test: /\.ts(x?)$/,
    exclude: /node_modules/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          ...babelOptions,
          // babelrc,
          cacheDirectory: true,
          compact: false,
          cacheIdentifier: 'server',
          cacheCompression: false,
        },
      },
      'ts-loader',
    ],
  },
  {
    test: /\.m?([jt])s(x?)$/,
    include: /node_modules/,
    exclude: [/@babel(?:\/|\\{1,2})runtime/, /core-js/],
    use: [
      {
        loader: 'babel-loader',
        options: {
          babelrc: false,
          compact: false,
          configFile: false,
          sourceMaps: false,
          cacheDirectory: true,
          cacheCompression: false,
          parserOpts: {
            allowReturnOutsideFunction
          },
          presets: [
            [
              '@babel/preset-env',
              {
                modules: false,
                useBuiltIns: false,
                exclude: ['transform-typeof-symbol']
              }
            ]
          ]
        }
      },
    ],
  },
  {
    test: /\.css$/,
    use: [
      'isomorphic-style-loader',
      {
        loader: 'css-loader',
        options: {
          sourceMap: true,
          modules: {
            localIdentName: cssLoaderConfig,
          },
        },
      },
    ]
  },
  {
    test: /\.s[ac]ss$/i,
    use: [
      'isomorphic-style-loader',
      {
        loader: 'css-loader',
        options: {
          sourceMap: true,
          modules: {
            localIdentName: cssLoaderConfig,
          },
        },
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: sassSourceMap,
        }
      }
    ],
  },
  {
    test: /\.svg$/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-react'],
        },
      },
      {
        loader: 'svg-sprite-loader',
        options: {
          // runtimeGenerator: path.join(__dirname, '/svg-to-icon-component-runtime-generator'),
          runtimeGenerator: require.resolve('../../utils/svg-to-icon-component-runtime-generator'),
          runtimeOptions: {
            iconModule:`${path.join(__dirname, '../..')}/utils/icon.js`
            // iconModule: path.join(__dirname, '/icon.js')
          }
        }
      },
    ],
  },
  {
    test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
    loader: 'url-loader',
    options: {
      limit: 10000,
      name: 'img/[name].[hash:8].[ext]',
    },
  },
];

module.exports = loaders;