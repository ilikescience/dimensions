const path = require('path');

module.exports = {
  entry: './scripts/main.js',
  output: {
    path: path.resolve('./scripts'),
    publicPath: '/scripts',
    filename: 'main.bundle.js' },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ }
    ]
  },
  devServer: {
    contentBase: './' }
};
