const path = require('path');
const fs = require('fs');

// Dynamisch alle Testordner finden
const testsDir = path.join(__dirname, 'tests');
const testFolders = fs.readdirSync(testsDir).filter(f => fs.statSync(path.join(testsDir, f)).isDirectory());

// Eine Webpack-Konfiguration für jeden Testordner erstellen
const config = testFolders.map(folder => ({
  mode: 'development',
  entry: path.join(testsDir, folder, 'diagram.js'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(testsDir, folder),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
}));

module.exports = config;