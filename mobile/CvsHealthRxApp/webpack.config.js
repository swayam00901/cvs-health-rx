// React Native Web bundle — lets the same codebase serve the Web team.
const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'index.web.js'),
  output: { path: path.resolve(__dirname, 'dist'), filename: 'bundle.js' },
  resolve: {
    alias: { 'react-native$': 'react-native-web' },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        exclude: /node_modules\/(?!(react-native-.*)\/).*/,
        use: { loader: 'babel-loader', options: { presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'] } },
      },
    ],
  },
  devServer: { port: 19006, historyApiFallback: true },
};
