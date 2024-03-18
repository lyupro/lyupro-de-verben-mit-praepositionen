// routes/verb.js
const express = require('express');
const router = express.Router();
const Verb = require('../models/verb');

// Маршрут для получения случайного глагола и предложений
router.get('/', async (req, res) => {
    const count = await Verb.countDocuments();
    const random = Math.floor(Math.random() * count);
    const verb = await Verb.findOne().skip(random);
    res.render('verb', { verb });
});

// Маршрут для проверки предложения
router.post('/check', async (req, res) => {
    const verb = req.body.verb;
    const sentence = req.body.sentence;

    try {
        const verbData = await Verb.findOne({ verb });

        if (!verbData) {
            return res.send(`Глагол "${verb}" не найден в базе данных.`);
        }

        const correctSentences = verbData.sentences;

        if (correctSentences.includes(sentence)) {
            res.send(`Правильно! "${sentence}" является верным предложением для глагола "${verb}".`);
        } else {
            res.send(`Неверно. "${sentence}" не является верным предложением для глагола "${verb}".`);
        }
    } catch (error) {
        console.error('Ошибка при проверке предложения:', error);
        res.status(500).send('Внутренняя ошибка сервера');
    }
});

module.exports = router;