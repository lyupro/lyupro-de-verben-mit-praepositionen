// server.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path = require('path');

// Настройка шаблонизатора EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Парсинг тела запроса
app.use(express.urlencoded({ extended: true }));

// Подключение к MongoDB
mongoose.connect('mongodb://localhost/deVerbsMitPraepApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Определение схемы MongoDB
const verbSchema = new mongoose.Schema({
    verb: String,
    sentences: [String]
});

const Verb = mongoose.model('Verb', verbSchema);

// Маршрут для стартовой страницы
app.get('/', (req, res) => {
    res.render('index', { title: 'Добро пожаловать!' });
});

// Маршрут для получения случайного глагола и предложений
app.get('/verb', async (req, res) => {
    const count = await Verb.countDocuments();
    const random = Math.floor(Math.random() * count);
    const verb = await Verb.findOne().skip(random);
    //res.json(verb);
    res.render('verb', { verb });
});

app.post('/check', async (req, res) => {
    const verb = req.body.verb;
    const sentence = req.body.sentence;

    const verbData = await Verb.findOne({ verb });
    const correctSentences = verbData.sentences;

    if (correctSentences.includes(sentence)) {
        res.send(`Правильно! "${sentence}" является верным предложением для глагола "${verb}".`);
    } else {
        res.send(`Неверно. "${sentence}" не является верным предложением для глагола "${verb}".`);
    }
});

// Запуск сервера
app.listen(3000, () => {
    console.log('Server started on port 3000');
});