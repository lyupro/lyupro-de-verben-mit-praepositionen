// server.js
import 'dotenv/config';

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import { connectToDatabase } from './db.js';
import { getNamedRoute } from './middleware/namedRoutes.js';
import { createModels } from './models/verb.js';
import apiRouter from './routes/api.js';
import verbRoute from './routes/verb.js';
import verbsRoute from './routes/verbs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Настройка MIME-типов для CSS и JavaScript файлов
const mimeTypes = {
    'text/css': ['css'],
    'application/javascript': ['js']
};

// Настройка шаблонизатора EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Обслуживания статических файлов из директории public (для styles и других)
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        const extension = path.split('.').pop();
        const mimeType = mimeTypes[extension];
        if (mimeType) {
            res.setHeader('Content-Type', mimeType);
        }
    }
}));

// Парсинг тела запроса (middleware for parsing) in verb.js line 16: 'const verb = req.body.verb;'
app.use(express.urlencoded({ extended: true }));

// Middleware для обработки методов PUT и DELETE через форму
// Позволяет использовать _method=PUT или _method=DELETE в качестве параметра запроса
// для эмуляции соответствующих HTTP методов
app.use(methodOverride('_method'));


app.locals.getNamedRoute = getNamedRoute;

// Подключение к базе данных и создание моделей
connectToDatabase()
    .then(() => {
        createModels();
        console.log('Models created');
    })
    .catch((err) => {
        console.error('Failed to create models:', err);
        process.exit(1);
    });


// Маршрут для стартовой страницы
app.get('/', (req, res) => {
    res.render('index', { title: 'Онлайн тренажер по немецкому языку', indexStyles: true });
});

// Маршрут для работы с API
app.use('/api', apiRouter);

// Маршрут для работы с глаголами
app.use('/verb', verbRoute);

// Маршрут для работы со списком глаголов
app.use('/verbs', verbsRoute);

app.get('/about', (req, res) => {
    res.render('about', { title: 'О Нас!', aboutStyles: true });
});


// Обработка ошибок try/catch и next(error) с помощью middleware после всех маршрутов
// Блок catch получает ошибку в параметре error и передает ее в middleware обработки ошибок с помощью next(error)
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Устанавливаем код состояния ошибки
    res.status(err.status || 500);

    // Рендерим страницу ошибки и передаем информацию об ошибке
    res.render('error', {
        title: 'Ошибка',
        message: err.message,
        statusCode: err.status || 500,
        stack: process.env.APP_ENV === 'development' && process.env.APP_DEBUG === 'true' ? err.stack : '',
        error: process.env.APP_ENV === 'development' && process.env.APP_DEBUG === 'true' ? err : {},
    });
});


// Запуск сервера
app.listen(3000, () => {
    console.log('Server started on port 3000');
});
