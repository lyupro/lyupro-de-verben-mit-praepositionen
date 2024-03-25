// utils/letterUtils.js
const Verb = require('../models/verb');

async function renderVerbsByLetter(req, res, next, letter, page) {
    try {

        // Проверяем, соответствует ли переданная буква алфавиту
        if (!/^[A-Z]$/.test(letter)) {
            const error = new Error('Недопустимая буква. Пожалуйста, выберите букву от A до Z.');
            error.status = 400;
            throw error;
        }

        if (isNaN(page) || page < 1) {
            const error = new Error('Неверный номер страницы');
            error.status = 400;
            throw error;
        }

        const limit = 10;
        const regex = new RegExp(`^${letter}`, 'i');
        const totalVerbs = await Verb.countDocuments({ verb: regex });
        const totalPages = Math.ceil(totalVerbs / limit);

        if (page < 1 || page > totalPages) {
            const error = new Error('Страница не найдена');
            error.status = 404;
            throw error;
        }

        const skip = (page - 1) * limit;

        const verbs = await Verb.find({ verb: regex }).skip(skip).limit(limit);
        console.log("letterUtils.js | renderVerbsByLetter() verbs = "+ verbs);
        res.render('letter', {
            letter,
            verbs,
            currentPage: page,
            totalPages,
            layout: false
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    renderVerbsByLetter
};