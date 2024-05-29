const express = require('express');
const router = express.Router();
const { updateVerb, getVerbData} = require('../../utils/verbUtils');
const { validateLetter, validateVerbText } = require('../../utils/validationUtils');

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
        console.log('/:letter/:verb/edit | conjugations: ', conjugations);

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
        //console.log('PUT /verbs/:letter/:verb | conjugations: ', conjugations);

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
        //console.log('PUT /verbs/:letter/:verb | updatedVerbData: ', updatedVerbData);

        if (!updatedVerbData) {
            return res.status(404).send('Глагол не найден');
        }

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
    } catch (error) {
        next(error);
    }
});

module.exports = router;