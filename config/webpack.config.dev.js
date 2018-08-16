process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";
const webpack = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const dir = require("./paths");

module.exports = {
  mode: "development",
  devtool: "cheap-module-source-map",
  entry: {
    app: [
      "babel-polyfill",
      dir.app,
      "webpack-dev-server/client?http://localhost:4000",
      "webpack/hot/dev-server"
    ],
    vendor: ["react", "react-dom"]
  },
  output: {
    path: dir.dist,
    filename: "./static/js/[name].[hash].js",
    chunkFilename: "./static/js/[name].[hash].js",
    sourceMapFilename: "./static/js/[file].map?[hash]"
  },
  resolve: {
    modules: ["node_modules", dir.app],
    extensions: [".js", ".jsx", "css", ".json", ".styl"]
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
            presets: ["react-app", "env", "flow"]
          }
        }
      },
      {
        test: /\.styl$/,
        use: ["style-loader", "css-loader", "stylus-loader"]
      }
    ]
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      inject: true,
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
  ]
};
