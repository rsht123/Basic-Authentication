const path = require('path');

module.exports = {
    entry: "./src/index.js",
    output: {
        path: path.resolve(__dirname, "public/build"),
        publicPath: '/',
        filename: 'bundle.js'
    },
    module: {
        loaders: [{
            test: /\.js?$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            query: {
                presets: ['env', 'react']
            }
        }]
    } 
}