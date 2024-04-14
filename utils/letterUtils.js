// utils/letterUtils.js
const { getVerbModel } = require('../models/verb');
const alphabetConfig = require('../config/alphabet');
const { getVerbsWithTranslations, getAlphabetWithAvailability } = require('./verbUtils');

async function renderVerbsByLetter(req, res, next, letter, page) {
    try {
        // Приводим букву к нижнему регистру
        const lowerCaseLetter = letter.toLowerCase();

        // Проверяем, соответствует ли переданная буква алфавиту
        if (!alphabetConfig.letters.includes(lowerCaseLetter)) {
            const error = new Error('Недопустимая буква. Пожалуйста, выберите букву из алфавита.');
            error.status = 400;
            throw error;
        }

        if (isNaN(page) || page < 1) {
            const error = new Error('Неверный номер страницы');
            error.status = 400;
            throw error;
        }

        const limit = 10;
        const VerbModel = getVerbModel(lowerCaseLetter);
        const regex = new RegExp(`^${lowerCaseLetter}`, 'i');
        const totalVerbs = await VerbModel.countDocuments({ verb: regex });
        const totalPages = Math.ceil(totalVerbs / limit);

        if (page < 1 || page > totalPages) {
            const error = new Error('Страница не найдена');
            error.status = 404;
            throw error;
        }

        const skip = (page - 1) * limit;
        // Static verbs on page (alphabet order)
        const verbs = await VerbModel.find({ verb: regex }).skip(skip).limit(limit);

        const verbsWithTranslations = await getVerbsWithTranslations(verbs);
        const { alphabet, letterAvailability } = await getAlphabetWithAvailability();

        res.render('partials/verbs/letterVerbs', {
            letter: lowerCaseLetter,
            verbs: verbsWithTranslations,
            currentPage: page,
            totalPages,
            alphabet,
            letterAvailability,
            pageTitle: `Список глаголов на букву ${lowerCaseLetter}`,
            pageHeader: `Список глаголов на букву ${lowerCaseLetter}`,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    renderVerbsByLetter
};