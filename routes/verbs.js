// routes/verbs.js
const express = require('express');
const router = express.Router();
const { getVerbModel, getVerbSentencesModel, getVerbTranslationModel, getVerbSentencesTranslationModel } = require('../models/verb');
const { getAlphabetWithAvailability, getVerbTranslation, renderVerbs, getVerbData } = require('../utils/verbUtils');
const { renderVerbsByLetter } = require('../utils/letterUtils');
const alphabetConfig = require('../config/alphabet');
const { validateLetter, validateQuery, validateVerbText } = require('../utils/validationUtils');


// Маршрут для отображения списка глаголов с пагинацией (по умолчанию - первая страница)
router.get('/', (req, res, next) => {
    renderVerbs(req, res, next);
});

// Маршрут для отображения списка глаголов с пагинацией (указанная страница)
router.get('/:page', (req, res, next) => {
    const page = parseInt(req.params.page);
    renderVerbs(req, res, next, page);
});

// Маршрут для поиска глаголов
router.get('/search', async (req, res, next) => {
    try {
        const query = req.query.q.toLowerCase();
        validateQuery(query);

        const verbs = [];

        for (const letter of alphabetConfig.letters) {
            const verbModel = getVerbModel(letter);
            const verbsForLetter = await verbModel.find({ verb: { $regex: `^${query}`, $options: 'i' } }).limit(5);

            for (const verb of verbsForLetter) {
                const { displayTranslation } = await getVerbTranslation(letter, 'ru', verb.verb_id);
                verbs.push({ ...verb.toObject(), translation: displayTranslation });
            }
        }

        res.json(verbs);
    } catch (error) {
        next(error);
    }
});

// Маршрут для отображения глаголов по выбранной букве
router.get('/:letter', async (req, res, next, page = 1) => {
    const letter = req.params.letter.toLowerCase();
    validateLetter(letter);

    renderVerbsByLetter(req, res, next, letter, page);
});

// Маршрут для отображения глаголов по выбранной букве (указанная страница)
router.get('/:letter/:page', async (req, res, next) => {
    const letter = req.params.letter.toLowerCase();
    validateLetter(letter);

    const page = parseInt(req.params.page) || 1;
    renderVerbsByLetter(req, res, next, letter, page);
});

// Маршрут для отображения выбранного глагола
router.get('/:letter/:verb', async (req, res, next) => {
    try{
        const letter = req.params.letter.toLowerCase();
        validateLetter(letter);

        const verbText = req.params.verb;
        validateVerbText(verbText);

        const verbData = await getVerbData(letter, verbText);
        const { verb, translation, sentences, sentencesTranslation } = verbData;

        res.render('verb', {
            verb,
            translation,
            sentences,
            sentencesTranslation: sentencesTranslation,
            pageTitle: `Глагол: ${verb.verb}`,
            pageHeader: `Глагол: ${verb.verb}`,
        });
    } catch (error) {
        next(error)
    }
});

router.get('/:letter/:verb/learn/visually', async (req, res, next) => {
    try {
        const letter = req.params.letter.toLowerCase();
        const verbText = req.params.verb;

        const verbData = await getVerbData(letter, verbText);
        const { verb, translation } = verbData;

        res.json({ verb: verb.verb, translation });
    } catch (error) {
        next(error);
    }
});

module.exports = router;