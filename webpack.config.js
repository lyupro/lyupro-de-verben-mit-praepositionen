// webpack.config.js
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDevelopment = process.env.NODE_ENV === 'development';

export default {
    mode: isDevelopment ? 'development' : 'production',
    entry: {
        verbLearning: './public/javascripts/verb/verbLearning.js',
        search: './public/javascripts/search.js',
        alphabet: './public/javascripts/alphabet.js',
        namedRoutes: './public/javascripts/utils/namedRoutes.js',
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