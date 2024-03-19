// routes/verbList.js
const express = require('express');
const router = express.Router();
const Verb = require('../models/verb');
const { getAlphabetWithAvailability, renderVerbList } = require('../utils/verbUtils');


// Маршрут для отображения списка глаголов с пагинацией (по умолчанию - первая страница)
router.get('/', (req, res, next) => {
    renderVerbList(req, res, next);
});

// Маршрут для отображения списка глаголов с пагинацией (указанная страница)
router.get('/page/:page', (req, res, next) => {
    const page = parseInt(req.params.page);
    renderVerbList(req, res, next, page);
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
router.get('/letter/:letter', async (req, res, next) => {
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
router.get('/letter/:letter/:verb', async (req, res, next) => {
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