// routes/verbList.js
const express = require('express');
const router = express.Router();
const Verb = require('../models/verb');

// Маршрут для отображения списка глаголов
router.get('/', async (req, res) => {
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

// Маршрут для поиска глаголов
router.get('/search', async (req, res) => {
    const query = req.query.q.toLowerCase();
    const verbs = await Verb.find({
        $or: [
            { verb: { $regex: `^${query}`, $options: 'i' } },
            { translation: { $regex: `${query}`, $options: 'i' } }
        ]
    }).limit(5);
    res.json(verbs);
});

// Маршрут для отображения глаголов по выбранной букве
router.get('/:letter', async (req, res) => {
    const letter = req.params.letter.toUpperCase();
    const regex = new RegExp(`^${letter}`, 'i');
    const verbs = await Verb.find({ verb: regex });
    res.render('letter', { letter, verbs });
});

// Маршрут для отображения выбранного глагола
router.get('/:letter/:verb', async (req, res) => {
    const letter = req.params.letter.toUpperCase();
    const verb = req.params.verb;
    const verbData = await Verb.findOne({ verb });
    if (verbData) {
        res.render('verb', { verb: verbData });
    } else {
        res.status(404).send('Глагол не найден');
    }
});

module.exports = router;