// utils/verbUtils.js
const { getVerbModel, getVerbTranslationModel } = require('../models/verb');
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
            limit
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAlphabetWithAvailability,
    getVerbsWithTranslations,
    renderVerbs
};