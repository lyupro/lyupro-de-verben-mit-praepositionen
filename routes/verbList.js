// routes/verbList.js
const express = require('express');
const router = express.Router();
const Verb = require('../models/verb');

// Маршрут для отображения списка глаголов
router.get('/', async (req, res, next) => {
    try {
        const verbs = await Verb.find({});
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

        // Получаем параметр "enableLetterFilter" из .env файла
        const enableLetterFilter = process.env.ENABLE_LETTER_FILTER === 'true';

        if (enableLetterFilter !== true && enableLetterFilter !== false) {
            const error = new Error('Некорректное значение параметра ENABLE_LETTER_FILTER');
            error.status = 500;
            throw error;
        }

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
    } catch (error) {
        next(error);
    }
});

// Маршрут для поиска глаголов
router.get('/search', async (req, res, next) => {
    try {
        const query = req.query.q.toLowerCase();

        if (!query) {
            const error = new Error('Запрос поиска не может быть пустым');
            error.status = 400;
            throw error;
        }

        const verbs = await Verb.find({
            $or: [
                { verb: { $regex: `^${query}`, $options: 'i' } },
                { translation: { $regex: `${query}`, $options: 'i' } }
            ]
        }).limit(5);
        res.json(verbs);
    } catch (error) {
        next(error);
    }
});

// Маршрут для отображения глаголов по выбранной букве
router.get('/:letter', async (req, res, next) => {
    try {
        const letter = req.params.letter.toUpperCase();

        // Проверяем, соответствует ли переданная буква алфавиту
        if (!/^[A-Z]$/.test(letter)) {
            const error = new Error('Недопустимая буква. Пожалуйста, выберите букву от A до Z.');
            error.status = 400;
            throw error;
        }

        const regex = new RegExp(`^${letter}`, 'i');
        const verbs = await Verb.find({ verb: regex });
        res.render('letter', { letter, verbs });
    } catch (error) {
        next(error);
    }
});

// Маршрут для отображения выбранного глагола
router.get('/:letter/:verb', async (req, res, next) => {
    try{
        const letter = req.params.letter.toUpperCase();
        const verb = req.params.verb;
        const verbData = await Verb.findOne({ verb });
        if (verbData) {
            res.render('verb', { verb: verbData });
        } else {
            const error = new Error('Глагол не найден');
            error.status = 404;
            throw error;
        }
    } catch (error) {
        next(error)
    }
});

module.exports = router;