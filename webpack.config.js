// webpack.config.js
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDevelopment = process.env.NODE_ENV === 'development';

export default {
    mode: isDevelopment ? 'development' : 'production',
    entry: {
        // Основные файлы
        alphabet: './public/javascripts/alphabet.js',
        search: './public/javascripts/search.js',
        pagination: './public/javascripts/pagination.js',
        themeSwitch: './public/javascripts/themeSwitch.js',
        checkSentence: './public/javascripts/checkSentence.js',
        verbCard: './public/javascripts/verbCard.js',
        
        // Утилиты
        namedRoutes: './public/javascripts/utils/namedRoutes.js',
        
        // Verb-связанные
        verbLearning: './public/javascripts/verb/verbLearning.js',
        addTranslationField: './public/javascripts/verbs/addTranslationField.js',
        
        // User-связанные  
        verbInteractions: './public/javascripts/user/verbInteractions.js',
        userLists: './public/javascripts/user/lists.js',
        userListDetail: './public/javascripts/user/listDetail.js',
        userFavorites: './public/javascripts/user/favorites.js',
        
        // Auth-связанные
        authHeader: './public/javascripts/auth/header.js',
        authLogin: './public/javascripts/auth/login.js',
        authRegister: './public/javascripts/auth/register.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'public/javascripts/dist'),
        clean: true, // Очищаем папку dist перед сборкой
    },
    devtool: 'source-map', // Для отладки
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
    resolve: {
        extensions: ['.js'],
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
                common: {
                    name: 'common',
                    minChunks: 2,
                    chunks: 'all',
                    enforce: true,
                },
            },
        },
    },
};