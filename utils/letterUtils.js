// utils/letterUtils.js
const { getVerbModel } = require('../models/verb');
const alphabetConfig = require('../config/alphabet');

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
        //const verbs = await VerbModel.find({ verb: regex }).skip(skip).limit(limit);
        const verbs = await VerbModel.aggregate([
            { $match: { verb: regex } },
            { $sample: { size: totalVerbs } },
            { $skip: skip },
            { $limit: limit }
        ]);
        //console.log("letterUtils.js | renderVerbsByLetter() verbs = "+ verbs);

        res.render('letter', {
            letter: lowerCaseLetter,
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