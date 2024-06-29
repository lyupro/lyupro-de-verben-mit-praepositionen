// routes/verbs/read.js
import {
    getVerbModel,
    getVerbTranslationModel,
    getVerbTensesModel,
    getVerbSentencesModel,
    getVerbSentencesTranslationModel,
} from '../../models/verb.js';
import {
    getAlphabetWithAvailability,
    getVerbTranslation,
    renderVerbs,
    getVerbData,
} from '../../utils/verbUtils.js';
import { renderVerbsByLetter } from '../../utils/letterUtils.js';
import alphabetConfig from '../../config/alphabet.js';
import {
    validateLetter,
    validateQuery,
    validateVerbText,
} from '../../utils/validationUtils.js';

// GET /verbs/search - Поиск глаголов
export const searchVerbs = async (req, res, next) => {
    try {
        const query = req.query.q.toLowerCase();
        console.log('GET /verbs/search | query: ', query);
        validateQuery(query);

        const verbs = [];

        for (const letter of alphabetConfig.getAll()) {
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
};

// GET /verbs/:letter/:verb/learn/visually - Получение данных для визуального обучения глагола
export const getVerbDataForVisualLearning = async (req, res, next) => {
    try {
        const letter = req.params.letter.toLowerCase();
        const verbText = req.params.verb;

        const verbData = await getVerbData(letter, verbText);
        const { verb, translation } = verbData;

        res.json({ verb: verb.verb, translation });
    } catch (error) {
        next(error);
    }
};

// GET /verbs/:letter/:verb - Отображение выбранного глагола
export const showVerb = async (req, res, next) => {
    try{
        const letter = req.params.letter.toLowerCase();
        console.log('/:letter/:verb | letter: ', letter);
        validateLetter(letter);

        const verbText = req.params.verb;
        console.log('/:letter/:verb | verbText: ', verbText);
        validateVerbText(verbText);

        const verbData = await getVerbData(letter, verbText);
        const { verb, translation, conjugations, sentences, sentencesTranslation } = verbData;

        if (req.query.edit) {
            return res.render('partials/verb/verbDetailsForm', {
                verb: verb.verb,
                letter,
                translation: translation.translations,
                conjugations: conjugations,
                sentences,
                sentencesTranslation,
            });
        }

        res.render('verb', {
            verb,
            translation,
            sentences,
            //sentencesTranslation: sentencesTranslation, // OLD
            sentencesTranslation,
            pageTitle: `Глагол: ${verb.verb}`,
            pageHeader: `Глагол: ${verb.verb}`,
            editMode: false, // Передаем editMode: false для отображения информации о глаголе
        });
    } catch (error) {
        next(error)
    }
};

// GET /verbs/:letter/:page - Отображение глаголов по выбранной букве (указанная страница)
// GET /verbs/:letter - Отображение глаголов по выбранной букве
export const showVerbsByLetter = async (req, res, next) => {
    const letter = req.params.letter.toLowerCase();
    validateLetter(letter);

    const page = parseInt(req.params.page) || 1;

    await renderVerbsByLetter(req, res, next, letter, page);
};

// GET /verbs/:page - Отображение списка глаголов с пагинацией (указанная страница)
// GET /verbs - Отображение списка глаголов с пагинацией (по умолчанию - первая страница)
export const showVerbsWithPagination = async (req, res, next) => {
    const page = parseInt(req.params.page) || 1;

    await renderVerbs(req, res, next, page);
};