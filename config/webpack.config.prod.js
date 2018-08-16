const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const dir = require("./paths");

module.exports = {
  mode: "production",
  devtool: "source-map",
  entry: {
    app: ["babel-polyfill", dir.app],
    vendor: ["react", "react-dom"]
  },
  output: {
    path: dir.dist,
    filename: "./static/js/[name].[hash:8].js",
    chunkFilename: "./static/js/[name].[hash:8].chunk.js"
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        enforce: "pre",
        use: [
          {
            options: {
              eslintPath: "eslint"
            },
            loader: "eslint-loader"
          }
        ],
        options: {
          configFile: `${dir.root}/.eslintrc.js`
        },
        include: dir.app
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        loader: "url-loader",
        options: {
          limit: 10000,
          name: "img/[name].[hash:8].[ext]"
        }
      },
      {
        test: [/\.jsx?$/, /\.js?$/],
        include: dir.app,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["react-app", "env", "flow"],
            plugins: [
              "transform-decorators-legacy",
              "transform-class-properties"
            ]
          }
        }
      },
      {
        test: /\.styl$/,
        use: ["style-loader", "css-loader", "stylus-loader"]
      }
    ]
  },
  resolve: {
    modules: ["node_modules", dir.app],
    extensions: [".js", ".jsx", "css", ".json", ".styl"]
  },
  plugins: [
    new CleanWebpackPlugin([dir.dist], {
      allowExternal: true
    }),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "public/index.html"
    }),
    new CopyWebpackPlugin([
      {
        from: `${dir.public}/img`,
        to: "./img"
      },
      {
        from: `${dir.public}/fonts`,
        to: "./fonts"
      }
    ])
  ],
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all"
        }
      }
    }
  }
};
