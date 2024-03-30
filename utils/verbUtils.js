// utils/verbUtils.js
const Verb = require('../models/verb');

async function getAlphabetWithAvailability() {
    try {
        const enableLetterFilter = process.env.ENABLE_LETTER_FILTER === 'true';

        if (enableLetterFilter !== true && enableLetterFilter !== false) {
            const error = new Error('Некорректное значение параметра ENABLE_LETTER_FILTER');
            error.status = 500;
            throw error;
        }
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

        // Создаем объект для хранения информации о доступности букв
        const letterAvailability = {};

        if (enableLetterFilter) {
            // Проверяем доступность каждой буквы
            for (const letter of alphabet) {
                const count = await Verb.countDocuments({ verb: new RegExp(`^${letter}`, 'i') });
                letterAvailability[letter] = count > 0;
            }
        } else {
            // Если фильтр отключен, помечаем все буквы как доступные
            alphabet.forEach(letter => {
                letterAvailability[letter] = true;
            });
        }

        return { alphabet, letterAvailability };
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

        const totalVerbs = await Verb.countDocuments();
        const totalPages = Math.ceil(totalVerbs / limit);

        if (page < 1 || page > totalPages) {
            const error = new Error('Страница не найдена');
            error.status = 404;
            throw error;
        }

        const verbs = await Verb.find({}).skip(skip).limit(limit);
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