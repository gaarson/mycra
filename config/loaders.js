const path = require('path');
const dir = require('./paths');

const cacheDir = path.resolve(dir.root, 'node_modules', '.cache');

const getThreadLoader = name => ({
  loader: require.resolve('thread-loader'),
  options: {
    workerParallelJobs: 20,
    poolRespawn: false,
    name,
  },
});

const loaders = [
  {
    exclude: /node_modules/,
    test: /\.ts(x?)$/,
    use: [
      {
        loader: require.resolve('babel-loader'),
      },
      {
        loader: require.resolve('ts-loader'),
      },
      {
        loader: require.resolve('cache-loader'),
        options: {
          cacheDirectory: path.resolve(cacheDir, 'ts'),
        },
      },
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
      {
        loader: require.resolve('cache-loader'),
        options: {
          cacheDirectory: path.resolve(cacheDir, 'js'),
        },
      },
      getThreadLoader('js'),
    ],
  },
  {
    test: /\.css$/,
    use: [
      {
        loader: require.resolve('style-loader'),
        options: {
          esModule: true,
        },
      },
      {
        loader: require.resolve('css-loader'),
        options: {
          modules: true,
          importLoaders: 1,
        },
      },
      {
        loader: require.resolve('cache-loader'),
        options: {
          cacheDirectory: path.resolve(cacheDir, 'css'),
        },
      },
      getThreadLoader('css'),
    ],
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
            iconModule:`${path.join(__dirname, '..')}/utils/icon.jsx`
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

