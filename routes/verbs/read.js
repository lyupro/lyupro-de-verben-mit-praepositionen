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
    validatePageRange,
    validatePage,
} from '../../utils/validationUtils.js';
import { getNamedRoute } from '../../middleware/namedRoutes.js';

// GET /verbs/search - Поиск глаголов
export const searchVerbs = async (req, res, next) => {
    try {
        if (!req.query.q) {
            return res.status(400).json({
                message: 'Параметр запроса "q" отсутствует или пустой'
            });
        }
        
        const query = req.query.q.toLowerCase();
        console.log('GET /verbs/search | query: ', query);
        validateQuery(query);

        const verbs = [];

        for (const letter of alphabetConfig.getAll()) {
            const verbModel = getVerbModel(letter);
            const verbsForLetter = await verbModel.find({ verb: { $regex: `^${query}`, $options: 'i' } }).limit(5);

            for (const verb of verbsForLetter) {
                try {
                    const { displayTranslation } = await getVerbTranslation(letter, 'ru', verb.verb_id);
                    verbs.push({ ...verb.toObject(), translation: displayTranslation });
                } catch (error) {
                    console.warn(`Не удалось получить перевод для глагола ${verb.verb}:`, error.message);
                    verbs.push({ ...verb.toObject(), translation: 'Перевод не найден' });
                }
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
                translation: translation.verb,
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
        next(error);
    }
};

// GET /verbs/:letter/:page - Отображение глаголов по выбранной букве (указанная страница)
// GET /verbs/:letter - Отображение глаголов по выбранной букве
export const showVerbsByLetter = async (req, res, next) => {
    try {
        const letter = req.params.letter.toLowerCase();
        console.log('Requested letter:', letter);
        validateLetter(letter);

        const page = parseInt(req.params.page) || 1;
        console.log('Requested page:', page);

        await renderVerbsByLetter(req, res, next, letter, page);
    } catch (error) {
        next(error);
    }
};

// GET /verbs/:page - Отображение списка глаголов с пагинацией (указанная страница)
// GET /verbs - Отображение списка глаголов с пагинацией (по умолчанию - первая страница)
export async function showVerbsWithPagination(req, res, next) {
    try {
        const page = parseInt(req.params.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Получаем общее количество глаголов и данные для пагинации
        let totalVerbs = 0;
        const verbs = [];

        const letterCounts = {};
        for (const letter of alphabetConfig.getAll()) {
            const VerbModel = getVerbModel(letter);
            const count = await VerbModel.countDocuments();
            letterCounts[letter] = count;
            totalVerbs += count;
        }

        const totalPages = Math.ceil(totalVerbs / limit);
        
        // Проверяем валидность страницы
        try {
            validatePageRange(page, totalPages);
        } catch (error) {
            if (totalPages > 0) {
                return res.redirect(getNamedRoute('verbs.page', { page: 1 }));
            } else {
                // Нет глаголов в базе данных
                const { alphabet, letterAvailability } = await getAlphabetWithAvailability();
                return res.render('verbs', {
                    verbs: [],
                    alphabet,
                    letterAvailability,
                    currentPage: 1,
                    totalPages: 0,
                    noVerbs: true,
                    pageTitle: 'Глаголы',
                    pageHeader: 'Список глаголов',
                    verbsStyles: true,
                    verbsScripts: true
                });
            }
        }

        // Получаем глаголы для текущей страницы
        let currentCount = 0;
        let currentSkip = skip;
        
        for (const letter of alphabetConfig.getAll()) {
            if (currentCount >= limit) {
                break;
            }

            const VerbModel = getVerbModel(letter);
            const verbsForLetter = await VerbModel.find({})
                .sort({ verb: 1 })
                .skip(currentSkip)
                .limit(limit - currentCount);
            
            verbs.push(...verbsForLetter);
            currentCount += verbsForLetter.length;
            currentSkip = Math.max(0, currentSkip - letterCounts[letter]);
        }

        // Получаем переводы для глаголов
        const verbsWithTranslations = [];
        for (const verb of verbs) {
            const letter = verb.verb.charAt(0).toLowerCase();
            try {
                const { displayTranslation } = await getVerbTranslation(letter, 'ru', verb.verb_id);
                verbsWithTranslations.push({
                    ...verb.toObject(),
                    translation: displayTranslation
                });
            } catch (error) {
                console.warn(`Не удалось получить перевод для глагола ${verb.verb}:`, error.message);
                verbsWithTranslations.push({
                    ...verb.toObject(),
                    translation: 'Перевод не найден'
                });
            }
        }

        // Получаем данные об алфавите
        const { alphabet, letterAvailability } = await getAlphabetWithAvailability();
        
        res.render('verbs', {
            verbs: verbsWithTranslations,
            alphabet,
            letterAvailability,
            currentPage: page,
            totalPages,
            noVerbs: verbsWithTranslations.length === 0,
            pageTitle: 'Список глаголов',
            pageHeader: 'Список глаголов',
            verbsStyles: true,
            verbsScripts: true
        });
    } catch (error) {
        console.error('Error in showVerbsWithPagination:', error);
        next(error);
    }
}