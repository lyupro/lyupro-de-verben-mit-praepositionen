// routes/verb.js
const express = require('express');
const router = express.Router();
const { getVerbModel, getVerbSentencesModel } = require('../models/verb');
const alphabetConfig = require('../config/alphabet');
const { getAvailableAlphabetLetters } = require('../utils/alphabetUtils');

// Маршрут для получения случайного глагола и предложений
router.get('/', async (req, res, next) => {
    try{
        const availableAlphabetLetters  = await getAvailableAlphabetLetters();

        if (availableAlphabetLetters .length === 0) {
            const error = new Error('Нет доступных глаголов в базе данных.');
            error.status = 404;
            throw error;
        }

        const randomLetter = availableAlphabetLetters [Math.floor(Math.random() * availableAlphabetLetters .length)];
        const VerbModel = getVerbModel(randomLetter);
        //console.log('routes/verb.js | / | VerbModel: '+ VerbModel);
        if (!VerbModel) {
            const error = new Error(`Модель глагола для буквы "${randomLetter}" не найдена.`);
            error.status = 404;
            throw error;
        }

        const count = await VerbModel.countDocuments();
        if (count === 0) {
            const error = new Error(`Нет доступных глаголов для буквы "${randomLetter}".`);
            error.status = 404;
            throw error;
        }

        const random = Math.floor(Math.random() * count);
        const verb = await VerbModel.findOne().skip(random);
        if (!verb) {
            const error = new Error(`Не удалось найти случайный глагол для буквы "${randomLetter}".`);
            error.status = 500;
            throw error;
        }
        //console.log('Selected verb:', verb);

        const VerbSentenceModel = getVerbSentencesModel(randomLetter, 'present');
        const sentences = await VerbSentenceModel.find({ verb_id: verb.verb_id }).distinct('sentences');
        //console.log('Found sentences:', sentences);

        res.render('verb', { verb, sentences });
    } catch (error) {
        next(error);
    }
});

// Маршрут для проверки предложения
router.post('/check', async (req, res, next) => {
    const { verb: verbText, sentence } = req.body;

    try {
        if (!verbText || !sentence) {
            const error = new Error('Глагол и предложение обязательны для проверки.');
            error.status = 400;
            throw error;
        }

        const letter = verbText.charAt(0).toLowerCase();
        const VerbModel = getVerbModel(letter);
        const VerbSentenceModel = getVerbSentencesModel(letter, 'present');

        const verb = await VerbModel.findOne({ verb: verbText });

        if (!verb) {
            const error = new Error(`Глагол "${verbText}" не найден в базе данных.`);
            error.status = 404;
            throw error;
        }

        const correctSentences = await VerbSentenceModel.findOne({ verb_id: verb.verb_id }).distinct('sentences');

        if (correctSentences.includes(sentence)) {
            res.send(`Правильно! "${sentence}" является верным предложением для глагола "${verbText}".`);
        } else {
            res.send(`Неверно. "${sentence}" не является верным предложением для глагола "${verbText}".`);
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;