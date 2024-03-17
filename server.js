// server.js
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path = require('path');
const config = require('./config');


// Настройка шаблонизатора EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Парсинг тела запроса
app.use(express.urlencoded({ extended: true }));

// Подключение к MongoDB
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Определение схемы MongoDB
const verbSchema = new mongoose.Schema({
    verb: String,
    translation: String, // Новое поле для перевода
    sentences: [String]
});

const Verb = mongoose.model('Verb', verbSchema);

// Маршрут для стартовой страницы
app.get('/', (req, res) => {
    res.render('index', { title: 'Добро пожаловать!' });
});


// Route /verb and all it's requires
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


// Route /verb-list and all it's requires
app.get('/verb-list', async (req, res) => {
    const verbs = await Verb.find({});
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    // Получаем параметр "enableLetterFilter" из .env файла
    const enableLetterFilter = process.env.ENABLE_LETTER_FILTER === 'true';

    // Создаем объект для хранения информации о доступности букв
    const letterAvailability = {};

    if (enableLetterFilter) {
        // Проверяем доступность каждой буквы
        for (const letter of alphabet) {
            const count = await Verb.countDocuments({ verb: new RegExp(`^${letter}`, 'i') });
            letterAvailability[letter] = count > 0;
        }
    } else {
        // Если фильтр отключен, помечаем все буквы как доступные
        alphabet.forEach(letter => {
            letterAvailability[letter] = true;
        });
    }

    res.render('verb-list', { verbs, alphabet, letterAvailability, enableLetterFilter });
});

app.get('/search', async (req, res) => {
    const query = req.query.q.toLowerCase();
    const verbs = await Verb.find({
        $or: [
            { verb: { $regex: `^${query}`, $options: 'i' } },
            { translation: { $regex: `${query}`, $options: 'i' } }
        ]
    }).limit(5);
    res.json(verbs);
});

app.get('/verb-list/:letter', async (req, res) => {
    const letter = req.params.letter.toUpperCase();
    const regex = new RegExp(`^${letter}`, 'i');
    const verbs = await Verb.find({ verb: regex });
    res.render('letter', { letter, verbs });
});

app.get('/verb-list/:letter/:verb', async (req, res) => {
    const letter = req.params.letter.toUpperCase();
    const verb = req.params.verb;
    const verbData = await Verb.findOne({ verb });
    if (verbData) {
        res.render('verb', { verb: verbData });
    } else {
        res.status(404).send('Глагол не найден');
    }
});


// Запуск сервера
app.listen(3000, () => {
    console.log('Server started on port 3000');
});