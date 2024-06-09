// webpack.config.js

const path = require('path');
const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
    mode: isDevelopment ? 'development' : 'production',
    entry: {
        verbLearning: './public/javascripts/verb/verbLearning.js',
        search: './public/javascripts/search.js', // Добавляем новый входной файл
    },
    output: {
        filename: '[name].bundle.js', // Используем [name] для создания отдельных бандлов
        path: path.resolve(__dirname, 'public', 'javascripts', 'dist'),
        publicPath: '',
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
};