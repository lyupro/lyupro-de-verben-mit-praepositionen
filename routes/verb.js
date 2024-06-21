// routes/verb.js
import express from 'express';
import { getVerbModel, getVerbTranslationModel, getVerbSentencesModel, getVerbSentencesTranslationModel } from '../models/verb.js';
import alphabetConfig from '../config/alphabet.js';
import { getAvailableAlphabetLetters } from '../utils/alphabetUtils.js';
import { getVerbData } from '../utils/verbUtils.js';
import { validateLetter, validateQuery, validateVerb, validateVerbText, validateVerbTextAndSentence, validateAvailableVerbs } from '../utils/validationUtils.js';

const router = express.Router();

// Маршрут для получения случайного глагола и предложений
router.get('/', async (req, res, next) => {
    try{
        const availableAlphabetLetters  = await getAvailableAlphabetLetters();
        validateAvailableVerbs(availableAlphabetLetters);

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
            editMode: false, // Передаем editMode: false для отображения информации о глаголе
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
        validateVerbTextAndSentence(verbText, sentence);

        const letter = verbText.charAt(0).toLowerCase();
        const VerbModel = getVerbModel(letter);
        const VerbSentenceModel = getVerbSentencesModel(letter, 'present');

        const verb = await VerbModel.findOne({ verb: verbText });
        validateVerb({ verb, verbText});

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

export default router;