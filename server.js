// server.js
require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const { connectToDatabase } = require('./db');
const { createModels } = require('./models/verb');
const verbRoute = require('./routes/verb');
const verbListRoute = require('./routes/verbList');

// Обслуживания статических файлов из директории public (для styles и других)
app.use(express.static(path.join(__dirname, 'public')));


// Настройка шаблонизатора EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Парсинг тела запроса (middleware for parsing) in verb.js line 16: 'const verb = req.body.verb;'
app.use(express.urlencoded({ extended: true }));

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
    res.render('index', { title: 'Добро пожаловать!' });
});

// Маршрут для работы с глаголами
app.use('/verb', verbRoute);

// Маршрут для работы со списком глаголов
app.use('/verb-list', verbListRoute);

app.get('/about', (req, res) => {
    res.render('about', { title: 'О Нас!' });
});


// Обработка ошибок try/catch и next(error) с помощью middleware после всех маршрутов
// Блок catch получает ошибку в параметре error и передает ее в middleware обработки ошибок с помощью next(error)
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Устанавливаем код состояния ошибки
    res.status(err.status || 500);

    // Рендерим страницу ошибки и передаем информацию об ошибке
    res.render('error', {
        message: err.message,
        error: err
    });
});


// Запуск сервера
app.listen(3000, () => {
    console.log('Server started on port 3000');
});