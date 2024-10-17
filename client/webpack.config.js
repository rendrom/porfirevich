/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
// const ESLintPlugin = require('eslint-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const sassLoaderOptions = {
  implementation: require('sass'),
};

const cssLoader = {
  loader: 'css-loader',
  options: {
    esModule: false,
  },
};

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  const publicPath = process.env.BASE_URL || '/';

  return {
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? 'source-map' : 'eval-source-map',
    entry: {
      main: ['./src/main.ts'],
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].[contenthash:7].js',
      publicPath: publicPath,
    },
    resolve: {
      modules: [path.resolve(__dirname, 'node_modules')],
      extensions: ['.js', '.ts', '.tsx', '.vue', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          test: /\.(js|ts)x?$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.css$/i,
          use: [
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            cssLoader,
          ],
        },
        {
          test: /\.s(c|a)ss$/,
          use: [
            isProd ? MiniCssExtractPlugin.loader : 'vue-style-loader',
            cssLoader,
            {
              loader: 'sass-loader',
              options: {
                ...sassLoaderOptions,
              },
            },
          ],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      // new ESLintPlugin({
      //   files: ['src'],
      //   extensions: ['ts', 'vue'],
      //   fix: true,
      // }),
      new CopyPlugin({
        patterns: [{ from: 'public' }],
      }),
      new ForkTsCheckerWebpackPlugin(),
      new VueLoaderPlugin(),
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
      }),
      new HtmlWebpackPlugin({
        template: 'src/index.html',
        filename: 'index.html',
      }),

      ...(isProd ? [new MiniCssExtractPlugin()] : []),
    ],
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        minSize: 10000,
        maxSize: 250000,
      },
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      hot: true,
      proxy: [
        {
          context: ['/api'],
          target: 'http://localhost:3000',
          changeOrigin: true,
          // pathRewrite: { '^/api': '' },
        },
        {
          context: ['/auth'],
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      ],
      historyApiFallback: true,
    },
  };
};
