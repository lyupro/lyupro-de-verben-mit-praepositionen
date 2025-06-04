// server.js
import 'dotenv/config';

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import methodOverride from 'method-override';
import { connectToDatabase } from './db.js';
import { getNamedRoute } from './middleware/namedRoutes.js';
import { createModels } from './models/verb.js';
import apiRouter from './routes/api.js';
import verbRoute from './routes/verb.js';
import authRoutes from './routes/auth/authRoutes.js';
import verbRoutes from './routes/verbs/verbRoutes.js';
import adminRoutes from './routes/admin/adminRoutes.js';
import adminRoutesView from './routes/admin/adminRoutesView.js';
import userRoutes from './routes/user/userRoutes.js';
import { authenticateJWT } from './middleware/auth/authenticateJWT.js';
import { errorHandler } from './middleware/error/errorHandler.js';

// Adds founded variables to the process.env object
dotenv.config();

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
app.use(express.json());

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

app.get('/about', (req, res) => {
    res.render('about', { title: 'О Нас!', aboutStyles: true });
});


// Маршрут для работы с глаголами
app.use('/verb', verbRoute);

// Маршрут для работы с API
app.use('/api', apiRouter);
app.use('/auth', authRoutes);
app.use('/verbs', verbRoutes);
app.use('/user', userRoutes);
app.use('/admin', authenticateJWT, adminRoutes);
app.use('/admin/view', authenticateJWT, adminRoutesView);


// Обработка ошибок try/catch и next(error) с помощью middleware после всех маршрутов
// Блок catch получает ошибку в параметре error и передает ее в middleware обработки ошибок с помощью next(error)
app.use(errorHandler);


// Запуск сервера
app.listen(3000, () => {
    console.log('Server started on port 3000');
});
