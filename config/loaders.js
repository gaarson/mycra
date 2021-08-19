const path = require('path');
const dir = require('./paths');
const buildMode = require('./buildMode');
const babelOptions = require('../babel.config');
const args = require('../utils/args');

const cacheDir = path.resolve(dir.root, 'node_modules', '.cache');

const getThreadLoader = name => ({
  loader: require.resolve('thread-loader'),
  options: {
    workerParallelJobs: 20,
    poolRespawn: false,
    name,
  },
});

const cssModulesScopedName = buildMode.isTest() 
  ? '[local]' 
  : '[local]___[hash:base64:7]';

const cacheLoader = (type) => {
  return {
    loader: require.resolve('cache-loader'),
    options: {
      cacheDirectory: path.resolve(cacheDir, type),
    }
  };
};

const loaders = [
  {
    exclude: /node_modules/,
    test: /\.ts(x?)$/,
    use: [
      {
        loader: require.resolve('babel-loader'),
        options: babelOptions,
      },
      {
        loader: require.resolve('ts-loader'),
      },
      cacheLoader('ts'),
      getThreadLoader('ts'),
    ],
  },
  {
    exclude: /node_modules/,
    test: /\.js(x?)$/,
    use: [
      {
        loader: require.resolve('babel-loader'),
        options: {
          presets: [
            require.resolve("@babel/preset-react"),
          ],
        },
      },
      cacheLoader('js'),
      getThreadLoader('js'),
    ],
  },
  {
    test: /\.css$/,
    oneOf: [
      {
        resourceQuery: /^\?raw$/,
        use: [
            require.resolve('style-loader'),
            require.resolve('css-loader')
        ]
      },
      {
        use: [
          require.resolve('style-loader'),
          {
            loader: require.resolve('css-loader'),
            options: {
              sourceMap: buildMode.isDevelop(),
              modules: {
                localIdentName: cssModulesScopedName,
              },
            },
          },
          cacheLoader('css'),
          getThreadLoader('css'),
        ],
      }
    ]
  },
  {
    test: /\.s[ac]ss$/i,
    oneOf: [
      {
        resourceQuery: /^\?raw$/,
        use: [
            require.resolve('style-loader'),
            require.resolve('css-loader'),
            require.resolve('sass-loader'),
        ]
      },
      {
        use: [
          require.resolve('style-loader'),
          {
            loader: require.resolve('css-loader'),
            options: {
              sourceMap: buildMode.isDevelop(),
              modules: {
                localIdentName: cssModulesScopedName,
              },
            },
          },
          require.resolve('sass-loader'),
          cacheLoader('sass'),
          getThreadLoader('sass'),
        ],
      }
    ]
  },
  {
    test: /\.svg$/,
    use: [
      {
        loader: require.resolve('babel-loader'),
        options: {
          presets: [
            require.resolve("@babel/preset-react"),
          ],
        },
      },
      { 
        loader: require.resolve('svg-sprite-loader'),
        options: {
          runtimeGenerator: require.resolve('../utils/svg-to-icon-component-runtime-generator'),
          runtimeOptions: {
            iconModule:`${path.join(__dirname, '..')}/utils/icon.js`
          }
        }
      },
    ]
  },
  {
    test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
    loader: require.resolve('url-loader'),
    options: {
      limit: 10000,
      name: 'img/[name].[hash:8].[ext]',
    },
  },
];

module.exports = loaders;

