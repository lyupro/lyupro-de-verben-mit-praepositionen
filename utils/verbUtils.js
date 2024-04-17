// utils/verbUtils.js
const { getVerbModel, getVerbTranslationModel, getVerbSentencesModel, getVerbSentencesTranslationModel } = require('../models/verb');
const alphabetConfig = require('../config/alphabet');

async function getAlphabetWithAvailability() {
    try {
        const enableLetterFilter = process.env.ENABLE_LETTER_FILTER;
        if (enableLetterFilter === undefined) {
            const error = new Error('Переменная окружения ENABLE_LETTER_FILTER не установлена');
            error.status = 500;
            throw error;
        }

        if (enableLetterFilter !== 'true' && enableLetterFilter !== 'false') {
            const error = new Error('Некорректное значение переменной окружения ENABLE_LETTER_FILTER');
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

async function getVerbTranslation(letter, language, verbId) {
    const VerbTranslationModel = getVerbTranslationModel(letter, language);
    const translation = await VerbTranslationModel.findOne({ verb_id: verbId });
    if (!translation) {
        throw new Error(`Перевод для глагола с ID "${verbId}" не найден`);
    }

    if (translation && translation.verb.length > 0) {
        const translations = translation.verb;
        //console.log('utils/verbUtils.js | getVerbTranslation() | translations: ', translations);
        const firstTranslation = translation.verb[0];
        //console.log('utils/verbUtils.js | getVerbTranslation() | firstTranslation: ', firstTranslation);
        const [mainTranslation, additionalInfo] = firstTranslation.split(/\s+(?=\()/);
        const displayTranslation = mainTranslation.trim();
        //console.log('utils/verbUtils.js | getVerbTranslation() | displayTranslation: ', displayTranslation);
        const tooltipText = additionalInfo ? additionalInfo.replace(/[()]/g, '').trim() : '';
        //console.log('utils/verbUtils.js | getVerbTranslation() | tooltipText: ', tooltipText);
        return { displayTranslation, tooltipText, translations: translations };
    } else {
        return { displayTranslation: 'Перевод недоступен', tooltipText: '', translations: [] };
    }
}

async function getVerbSentences(letter, tense, verbId) {
    try {
        const verbSentencesModel = getVerbSentencesModel(letter, tense);
        if (!verbSentencesModel) {
            const error = new Error(`Модель предложений для буквы "${letter}" и времени "${tense}" не найдена.`);
            error.status = 404;
            throw error;
        }

        const sentencesData = await verbSentencesModel.findOne({ verb_id: verbId });
        // Alternative without Sentences result and throw new Error()
        //if (!sentencesData) {
        //    throw new Error(`Предложения для глагола с ID "${verbId}" не найдены.`);
        //}

        const sentences = sentencesData ? sentencesData.sentences : [];
        //console.log('Found sentences:', sentences);

        return sentences;
    } catch (error) {
        throw new Error(`Ошибка при получении предложений для глагола с ID "${verbId}": ${error.message}`);
    }
}

async function getVerbSentencesTranslation(letter, tense, language, verbId) {
    try {
        const verbSentencesTranslationModel = getVerbSentencesTranslationModel(letter, tense, language);
        if (!verbSentencesTranslationModel) {
            const error = new Error(`Модель переводов предложений для буквы "${letter}", времени "${tense}" и языка "${language}" не найдена.`);
            error.status = 404;
            throw error;
        }

        const sentencesTranslationData = await verbSentencesTranslationModel.findOne({ verb_id: verbId });
        // Alternative without Sentences Translation result and throw new Error()
        //if (!sentencesTranslationData) {
        //    throw new Error(`Переводы предложений для глагола с ID "${verbId}" не найдены.`);
        //}

        const sentencesTranslation = sentencesTranslationData ? sentencesTranslationData.sentences : [];
        //console.log('Found sentencesTranslation:', sentencesTranslation);

        return sentencesTranslation;
    } catch (error) {
        throw new Error(`Ошибка при получении переводов предложений для глагола с ID "${verbId}": ${error.message}`);
    }
}

async function getVerbsWithTranslations(verbs) {
    return await Promise.all(
        verbs.map(async (verb) => {
            const letter = verb.verb.charAt(0).toLowerCase();
            const { displayTranslation, tooltipText, translations } = await getVerbTranslation(letter, 'ru', verb.verb_id);
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
            if (!verbText) {
                throw new Error('Текст глагола не указан.');
            }

            verb = await verbModel.findOne({ verb: verbText });
            //console.log('Selected verb:', verb);
            if (!verb) {
                throw new Error(`Глагол "${verbText}" не найден.`);
            }
        }

        const translation = await getVerbTranslation(letter, 'ru', verb.verb_id);
        if (!translation) {
            throw new Error(`Перевод для глагола "${verbText}" не найден.`);
        }

        const sentences = await getVerbSentences(letter, 'present', verb.verb_id);
        //console.log('sentences: ', sentences);
        const sentencesTranslation = await getVerbSentencesTranslation(letter, 'present', 'ru', verb.verb_id);
        //console.log('sentencesTranslation: ', sentencesTranslation);

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
    getVerbTranslation,
    getVerbSentences,
    getVerbSentencesTranslation,
    getVerbsWithTranslations,
    renderVerbs,
    getVerbData,
};