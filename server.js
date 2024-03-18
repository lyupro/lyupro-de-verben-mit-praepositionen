// server.js
require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
//const db = require('./db');
require('./db');
const Verb = require('./models/verb');
const verbRoute = require('./routes/verb');
const verbListRoute = require('./routes/verbList');


// Настройка шаблонизатора EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Парсинг тела запроса (middleware for parsing) in verb.js line 16: 'const verb = req.body.verb;'
app.use(express.urlencoded({ extended: true }));


// Маршрут для стартовой страницы
app.get('/', (req, res) => {
    res.render('index', { title: 'Добро пожаловать!' });
});

// Маршрут для работы с глаголами
app.use('/verb', verbRoute);

// Маршрут для работы со списком глаголов
app.use('/verb-list', verbListRoute);


// Запуск сервера
app.listen(3000, () => {
    console.log('Server started on port 3000');
});