// routes/verbs.js
const express = require('express');
const router = express.Router();
const { getVerbModel, getVerbSentencesModel, getVerbTranslationModel, getVerbSentencesTranslationModel } = require('../models/verb');
const { getAlphabetWithAvailability, renderVerbs } = require('../utils/verbUtils');
const { renderVerbsByLetter } = require('../utils/letterUtils');
const alphabetConfig = require('../config/alphabet');


// Маршрут для отображения списка глаголов с пагинацией (по умолчанию - первая страница)
router.get('/', (req, res, next) => {
    renderVerbs(req, res, next);
});

// Маршрут для отображения списка глаголов с пагинацией (указанная страница)
router.get('/page/:page', (req, res, next) => {
    const page = parseInt(req.params.page);
    renderVerbs(req, res, next, page);
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

        const verbs = [];

        for (const letter of alphabetConfig.letters) {
            const VerbModel = getVerbModel(letter);
            const verbsForLetter = await VerbModel.find({ verb: { $regex: `^${query}`, $options: 'i' } }).limit(5);
            verbs.push(...verbsForLetter);
        }

        res.json(verbs);
    } catch (error) {
        next(error);
    }
});

// Маршрут для отображения глаголов по выбранной букве
router.get('/letter/:letter', async (req, res, next, page = 1) => {
        const letter = req.params.letter.toUpperCase();
        renderVerbsByLetter(req, res, next, letter, page);
});

// Маршрут для отображения глаголов по выбранной букве (указанная страница)
router.get('/letter/:letter/page/:page', async (req, res, next) => {
    const letter = req.params.letter.toUpperCase();
    const page = parseInt(req.params.page) || 1;
    renderVerbsByLetter(req, res, next, letter, page);
});

// Маршрут для отображения выбранного глагола
router.get('/letter/:letter/:verb', async (req, res, next) => {
    try{
        const letter = req.params.letter.toLowerCase();
        const verbText = req.params.verb;
        const verbModel = getVerbModel(letter);
        const verbSentencesModel = getVerbSentencesModel(letter, 'present');
        const verbTranslationModel = getVerbTranslationModel(letter, 'ru');
        const verbSentencesTranslationModel = getVerbSentencesTranslationModel(letter, 'present', 'ru');

        const verb  = await verbModel.findOne({ verb: verbText });
        if (verb) {
            const sentencesData = await verbSentencesModel.findOne({ verb_id: verb.verb_id });
            const sentences = sentencesData ? sentencesData.sentences : [];
            //console.log('routes/verbs.js | /letter/:letter/:verb | sentences: ', sentences);
            const translation = await verbTranslationModel.findOne({ verb_id: verb.verb_id });
            //console.log('routes/verbs.js | /letter/:letter/:verb | translation: ', translation);
            const sentenceTranslations = await verbSentencesTranslationModel.findOne({ verb_id: verb.verb_id });
            //console.log('routes/verbs.js | /letter/:letter/:verb | sentenceTranslations: ', sentenceTranslations);

            res.render('verb', {
                verb,
                sentences: sentences ? sentences.sentences : [],
                translation,
                sentenceTranslations,
                pageTitle: `Глагол: ${verb.verb}`,
                pageHeader: `Глагол: ${verb.verb}`,
            });
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