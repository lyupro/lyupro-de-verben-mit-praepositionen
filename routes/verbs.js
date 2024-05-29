// routes/verbs.js
const express = require('express');
const router = express.Router();
const {
    getVerbModel,
    getVerbTranslationModel,
    getVerbTensesModel,
    getVerbSentencesModel,
    getVerbSentencesTranslationModel,
} = require('../models/verb');
const {
    getAlphabetWithAvailability,
    getVerbTranslation,
    renderVerbs,
    getVerbData,
    updateVerb,
    deleteVerb,
} = require('../utils/verbUtils');
const { renderVerbsByLetter } = require('../utils/letterUtils');
const alphabetConfig = require('../config/alphabet');
const {
    validateLetter,
    validateQuery,
    validateVerbText,
} = require('../utils/validationUtils');


// GET /verbs - Отображение списка глаголов с пагинацией (по умолчанию - первая страница)
router.get('/', (req, res, next) => {
    renderVerbs(req, res, next);
});

// GET /verbs/:page - Отображение списка глаголов с пагинацией (указанная страница)
router.get('/:page', (req, res, next) => {
    const page = parseInt(req.params.page);
    renderVerbs(req, res, next, page);
});

// GET /verbs/search - Поиск глаголов
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

// GET /verbs/:letter - Отображение глаголов по выбранной букве
router.get('/:letter', async (req, res, next, page = 1) => {
    const letter = req.params.letter.toLowerCase();
    validateLetter(letter);

    renderVerbsByLetter(req, res, next, letter, page);
});

// GET /verbs/:letter/:page - Отображение глаголов по выбранной букве (указанная страница)
router.get('/:letter/:page', async (req, res, next) => {
    const letter = req.params.letter.toLowerCase();
    validateLetter(letter);

    const page = parseInt(req.params.page) || 1;
    renderVerbsByLetter(req, res, next, letter, page);
});

// GET /verbs/:letter/:verb - Отображение выбранного глагола
router.get('/:letter/:verb', async (req, res, next) => {
    try{
        const letter = req.params.letter.toLowerCase();
        validateLetter(letter);

        const verbText = req.params.verb;
        validateVerbText(verbText);

        const verbData = await getVerbData(letter, verbText);
        const { verb, translation, sentences, sentencesTranslation } = verbData;

        if (req.query.edit) {
            return res.render('partials/verb/verbDetailsEdit', {
                verb: verb.verb,
                letter,
                translation: translation.translations,
                conjugations: translation.conjugations,
                sentences,
                sentencesTranslation,
            });
        }

        res.render('verb', {
            verb,
            translation,
            sentences,
            sentencesTranslation: sentencesTranslation,
            pageTitle: `Глагол: ${verb.verb}`,
            pageHeader: `Глагол: ${verb.verb}`,
            editMode: false, // Передаем editMode: false для отображения информации о глаголе
        });
    } catch (error) {
        next(error)
    }
});

// GET /verbs/:letter/:verb/edit - Отображение формы редактирования глагола
router.get('/:letter/:verb/edit', async (req, res, next) => {
    try {
        const letter = req.params.letter.toLowerCase();
        const verb = req.params.verb.toLowerCase();

        validateLetter(letter);
        validateVerbText(verb);

        const verbData = await getVerbData(letter, verb);
        //console.log('/:letter/:verb/edit | verbData: ', verbData);
        const { translation, conjugations, sentences, sentencesTranslation } = verbData;

        res.render('verb', {
            verb,
            letter,
            translation, // Передаем объект translation целиком
            conjugations,
            sentences,
            sentencesTranslation,
            pageTitle: `Редактировать глагол: ${verb}`,
            pageHeader: `Редактировать глагол: ${verb}`,
            editMode: true, // Передаем editMode: true для отображения только формы редактирования
        });
    } catch (error) {
        next(error);
    }
});

// PUT /verbs/:letter/:verb - Обновление глагола
router.put('/:letter/:verb', async (req, res, next) => {
    try {
        const letter = req.params.letter.toLowerCase();
        const verb = req.params.verb.toLowerCase();
        const translation = req.body.translations || []; // Получаем перевод из req.body.translations
        //console.log('PUT /verbs/:letter/:verb | translation: ', translation);
        const conjugations = req.body.conjugations || {};
        console.log('PUT /verbs/:letter/:verb | conjugations: ', conjugations);

        let { sentences, sentencesTranslation } = req.body;
        //console.log('PUT /verbs/:letter/:verb | sentences: ', sentences);
        //console.log('PUT /verbs/:letter/:verb | sentencesTranslation: ', sentencesTranslation);

        validateLetter(letter);
        validateVerbText(verb);

        // Преобразование строки sentences в массив объектов
        const newSentences = [];
        const newSentencesTranslation = [];

        if(sentences){
            for (const [key, value] of Object.entries(req.body.sentences)) {
                if (value.trim() !== '') {
                    newSentences.push({
                        sentence_id: parseInt(key),
                        sentence: value,
                    });
                }
            }
            sentences = newSentences;
            //console.log('PUT /verbs/:letter/:verb | sentences 2: ', sentences);
        }

        if(sentencesTranslation){
            for (const [key, value] of Object.entries(req.body.sentencesTranslation)) {
                if (value.trim() !== '') {
                    newSentencesTranslation.push({
                        sentence_id: parseInt(key),
                        sentence: value,
                    });
                }
            }
            sentencesTranslation = newSentencesTranslation;
            //console.log('PUT /verbs/:letter/:verb | sentencesTranslation 2: ', sentencesTranslation);
        }

        const updatedVerbData = await updateVerb(
            letter,
            verb,
            translation,
            conjugations,
            sentences,
            sentencesTranslation
        );

        if (!updatedVerbData) {
            return res.status(404).send('Глагол не найден');
        }

        //const verbData = await getVerbData(letter, verb);

        res.render('verb', {
            verb: verb,
            letter,
            translation: updatedVerbData.translation,
            conjugations: updatedVerbData.conjugations,
            sentences: updatedVerbData.sentences,
            sentencesTranslation: updatedVerbData.sentencesTranslation,
            pageTitle: `Редактировать глагол: ${verb}`,
            pageHeader: `Редактировать глагол: ${verb}`,
            editMode: true, // Передаем editMode: true для отображения только формы редактирования
        });

        //res.render('partials/verb/verbDetailsEdit', {
        //    verb: verb,
        //    letter,
        //    translation: updatedVerbData.translation,
        //    conjugations: updatedVerbData.conjugations,
        //    sentences: updatedVerbData.sentences,
        //    sentencesTranslation: updatedVerbData.sentencesTranslation,
        //});
    } catch (error) {
        next(error);
    }
});

// DELETE /verbs/:letter/:verb - Удаление глагола
router.delete('/:letter/:verb', async (req, res, next) => {
    try {
        const letter = req.params.letter.toLowerCase();
        const verb = req.params.verb.toLowerCase();

        validateLetter(letter);
        validateVerbText(verb);

        const deletedVerb = await deleteVerb(letter, verb);

        if (!deletedVerb) {
            return res.status(404).send('Глагол не найден');
        }

        res.sendStatus(204); // No Content
    } catch (error) {
        next(error);
    }
});

// GET /verbs/:letter/:verb/learn/visually - Получение данных для визуального обучения глагола
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