// routes/verb.js
const express = require('express');
const router = express.Router();
const { getVerbModel, getVerbTranslationModel, getVerbSentencesModel, getVerbSentencesTranslationModel } = require('../models/verb');
const alphabetConfig = require('../config/alphabet');
const { getAvailableAlphabetLetters } = require('../utils/alphabetUtils');
const { getVerbData } = require('../utils/verbUtils');

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
        const verbData = await getVerbData(randomLetter, '', true);

        const { verb, translation, sentences, sentencesTranslation } = verbData;

        res.render('verb', {
            verb,
            translation,
            sentences,
            sentencesTranslation: sentencesTranslation,
            pageTitle: `Случайный глагол: ${verb.verb}`,
            pageHeader: `Случайный глагол: ${verb.verb}`,
        });
    } catch (error) {
        next(error);
    }
});

// Маршрут для проверки предложения
router.post('/check', express.json(), async (req, res, next) => {
    const { verb: verbText, sentence } = req.body;

    try {
        //console.log('routes/verb.js | /check | verbText: ', verbText);
        //console.log('routes/verb.js | /check | sentence: ', sentence);
        if (!verbText || !sentence) {
            return res.status(400).send('Глагол и предложение обязательны для проверки.');
        }

        const letter = verbText.charAt(0).toLowerCase();
        const VerbModel = getVerbModel(letter);
        const VerbSentenceModel = getVerbSentencesModel(letter, 'present');

        const verb = await VerbModel.findOne({ verb: verbText });

        if (!verb) {
            return res.status(404).send(`Глагол "${verbText}" не найден в базе данных.`);
        }

        const sentencesData = await VerbSentenceModel.findOne({ verb_id: verb.verb_id });
        const correctSentences = sentencesData ? sentencesData.sentences : [];

        const isCorrect = correctSentences.some(sentenceObj => sentenceObj.sentence === sentence);

        if (isCorrect) {
            res.send(`Правильно! "${sentence}" является верным предложением для глагола "${verbText}".`);
        } else {
            res.send(`Неверно. "${sentence}" не является верным предложением для глагола "${verbText}".`);
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;