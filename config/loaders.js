const args = require('../utils/args');
const buildMode = require('./buildMode');
const babelOptions = require('../babel.config');

const getThreadLoader = (name, workers = 2) => ({
  loader: require.resolve('thread-loader'),
  options: {
    workers,
    workerParallelJobs: 100,
    poolRespawn: buildMode.isProduct() ? true : false,
    poolParallelJobs: 100,
    name,
  },
});

let svgLoader = {
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
      }
    },
  ],
};

if (args.splitSvg) {
  svgLoader = {
    test: /\.svg$/,
    oneOf: [
      {
        resourceQuery: /^\?react$/,
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
            }
          },
        ]
      },
      {
        loader: require.resolve('url-loader'),
      }
    ]
  };
}

const loaders = [
  {
    exclude: /node_modules/,
    test: /\.ts(x?)$/,
    use: [
      {
        loader: require.resolve('babel-loader'),
        options: babelOptions,
      },
      getThreadLoader('ts'),
      {
        loader: require.resolve('ts-loader'),
        options: {
          happyPackMode: true
        }
      },
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
    ],
  },
  {
    test: /\.css$/,
    oneOf: [
      {
        resourceQuery: /^\?raw$/,
        use: [
          require.resolve('style-loader'),
          require.resolve('css-loader'),
        ]
      },
      {
        use: [
          require.resolve('style-loader'),
          {
            loader: require.resolve('css-loader'),
            options: {
              url: false,
              sourceMap: buildMode.isDevelop(),
              modules: {
                getLocalIdent: (context, _, localName) => {
                  return buildMode.simpleClassHash(localName, context.resourcePath);
                },
              },
            },
          },
        ],
      }
    ]
  },
  {
    test: /\.scss$/,
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
              url: false,
              sourceMap: buildMode.isDevelop(),
              modules: {
                getLocalIdent: (context, _, localName) => {
                  return buildMode.simpleClassHash(localName, context.resourcePath);
                },
              },
            },
          },
          require.resolve('sass-loader'),
        ],
      }
    ]
  },
  {
    test: /\.sass$/,
    use: [
      require.resolve('style-loader'),
      require.resolve('css-loader'),
      require.resolve('sass-loader'),
    ],
  },
  svgLoader,
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

