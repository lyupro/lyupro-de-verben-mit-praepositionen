// utils/verbUtils.js
const { getVerbModel } = require('../models/verb');
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
            const verbsForLetter = await VerbModel.find({}).skip(currentSkip).limit(limit - currentCount);
            verbs.push(...verbsForLetter);
            currentCount += verbsForLetter.length;
            currentSkip = Math.max(0, currentSkip - letterCounts[letter]);
        }

        const { alphabet, letterAvailability } = await getAlphabetWithAvailability();

        res.render('verbs', {
            verbs,
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
    renderVerbs
};