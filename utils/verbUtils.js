// utils/verbUtils.js
const { getVerbModel, getVerbTranslationModel, getVerbSentencesModel, getVerbSentencesTranslationModel } = require('../models/verb');
const alphabetConfig = require('../config/alphabet');

async function getAlphabetWithAvailability() {
    try {
        const enableLetterFilter = process.env.ENABLE_LETTER_FILTER === 'true';

        if (enableLetterFilter !== true && enableLetterFilter !== false) {
            const error = new Error('Некорректное значение параметра ENABLE_LETTER_FILTER');
            error.status = 500;
            throw error;
        }

        // Создаем объект для хранения информации о доступности букв
        const letterAvailability = {};

        if (enableLetterFilter) {
            // Проверяем доступность каждой буквы
            for (const letter of alphabetConfig.letters) {
                const VerbModel = getVerbModel(letter);
                const count = await VerbModel.countDocuments();
                letterAvailability[letter] = count > 0;
            }
        } else {
            // Если фильтр отключен, помечаем все буквы как доступные
            alphabetConfig.letters.forEach(letter => {
                letterAvailability[letter] = true;
            });
        }

        return { alphabet: alphabetConfig.letters, letterAvailability };
    } catch (error) {
        console.error('Ошибка при получении доступности букв алфавита:', error);
        throw error;
    }
}
async function getVerbsWithTranslations(verbs) {
    return await Promise.all(
        verbs.map(async (verb) => {
            const letter = verb.verb.charAt(0).toLowerCase();
            const VerbTranslationModel = getVerbTranslationModel(letter, 'ru');
            const translation = await VerbTranslationModel.findOne({ verb_id: verb.verb_id });
            //console.log('utils/verbUtils.js | renderVerbs() | translation: ', translation);
            const translations = translation.verb;
            const firstTranslation = translation.verb[0];
            //console.log('utils/verbUtils.js | renderVerbs() | firstTranslation: ', firstTranslation);
            const [mainTranslation, additionalInfo] = firstTranslation.split(/\s+(?=\()/);
            const displayTranslation = mainTranslation.trim();
            //console.log('utils/verbUtils.js | renderVerbs() | displayTranslation: ', displayTranslation);
            const tooltipText = additionalInfo ? additionalInfo.replace(/[()]/g, '').trim() : '';
            //console.log('utils/verbUtils.js | renderVerbs() | tooltipText: ', tooltipText);
            return { ...verb.toObject(), translation: displayTranslation, tooltipText, translations };
        })
    );
}

async function renderVerbs(req, res, next, page = 1) {
    try {
        if (isNaN(page) || page < 1) {
            const error = new Error('Неверный номер страницы');
            error.status = 400;
            throw error;
        }

        const limit = 10;
        const skip = (page - 1) * limit;

        let totalVerbs = 0;
        const verbs = [];

        const letterCounts = {};
        for (const letter of alphabetConfig.letters) {
            const VerbModel = getVerbModel(letter);
            const count = await VerbModel.countDocuments();
            letterCounts[letter] = count;
            totalVerbs += count;
        }

        const totalPages = Math.ceil(totalVerbs / limit);

        if (page < 1 || page > totalPages) {
            const error = new Error('Страница не найдена');
            error.status = 404;
            throw error;
        }

        let currentCount = 0;
        let currentSkip = skip;
        for (const letter of alphabetConfig.letters) {
            if (currentCount >= limit) {
                break;
            }

            const VerbModel = getVerbModel(letter);
            const verbsForLetter = await VerbModel.find({}).sort({ verb: 1 }).skip(currentSkip).limit(limit - currentCount);
            verbs.push(...verbsForLetter);
            currentCount += verbsForLetter.length;
            currentSkip = Math.max(0, currentSkip - letterCounts[letter]);
        }

        //console.log('utils/verbUtils.js | renderVerbs() | //////////////////');
        const verbsWithTranslations = await getVerbsWithTranslations(verbs);

        const { alphabet, letterAvailability } = await getAlphabetWithAvailability();

        res.render('verbs', {
            verbs: verbsWithTranslations,
            alphabet,
            letterAvailability,
            currentPage: page,
            totalPages,
            limit,
            pageTitle: 'Список глаголов',
            pageHeader: 'Список глаголов',
        });
    } catch (error) {
        next(error);
    }
}

async function getVerbData(letter, verbText, random = false) {
    try {
        const verbModel = getVerbModel(letter);
        if (!verbModel) {
            const error = new Error(`Модель глагола для буквы "${letter}" не найдена.`);
            error.status = 404;
            throw error;
        }

        let verb;
        if (random) {
            const count = await verbModel.countDocuments();
            if (count === 0) {
                const error = new Error(`Нет доступных глаголов для буквы "${letter}".`);
                error.status = 404;
                throw error;
            }
            const randomIndex = Math.floor(Math.random() * count);
            verb = await verbModel.findOne().skip(randomIndex);
            //console.log('Selected Random verb:', verb);
            if (!verb) {
                throw new Error(`Не удалось найти случайный глагол "${verbText}" для буквы "${letter}".`);
            }
        } else {
            verb = await verbModel.findOne({ verb: verbText });
            //console.log('Selected verb:', verb);
            if (!verb) {
                throw new Error(`Глагол "${verbText}" не найден.`);
            }
        }

        const verbTranslationModel = getVerbTranslationModel(letter, 'ru');
        const verbSentencesModel = getVerbSentencesModel(letter, 'present');
        const verbSentencesTranslationModel = getVerbSentencesTranslationModel(letter, 'present', 'ru');

        const [translation, sentencesData, sentencesTranslationData] = await Promise.all([
            verbTranslationModel.findOne({ verb_id: verb.verb_id }),
            verbSentencesModel.findOne({ verb_id: verb.verb_id }),
            verbSentencesTranslationModel.findOne({ verb_id: verb.verb_id })
        ]);

        if (!translation) {
            throw new Error(`Перевод для глагола "${verbText}" не найден.`);
        }

        const sentences = sentencesData ? sentencesData.sentences : [];
        //console.log('Found sentences:', sentences);
        const sentencesTranslation = sentencesTranslationData ? sentencesTranslationData.sentences : [];
        //console.log('Found sentencesTranslation:', sentencesTranslation);

        // Alternative without Sentences Translation result and throw new Error()
        //if (!sentencesTranslation) {
        //    throw new Error(`Перевод предложений для глагола "${verbText}" не найден.`);
        //}

        return {
            verb,
            translation,
            sentences,
            sentencesTranslation,
        };
    } catch (error) {
        throw new Error(`Ошибка при получении данных для глагола "${verbText}": ${error.message}`);
    }
}

module.exports = {
    getAlphabetWithAvailability,
    getVerbsWithTranslations,
    renderVerbs,
    getVerbData,
};