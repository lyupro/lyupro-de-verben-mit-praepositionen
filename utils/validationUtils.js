// utils/validationUtils.js

const alphabetConfig = require('../config/alphabet');
const verbTensesConfig = require('../config/verbTenses');

function validateLetter(letter) {
    if (!letter || !alphabetConfig.letters.includes(letter)) {
        const error = new Error(`Некорректная буква алфавита: "${letter}"`);
        error.status = 400;
        throw error;
    }
}

function validateLetterFilter() {
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

    return enableLetterFilter === 'true';
}

function validateTense(tense) {
    if (!tense || !verbTensesConfig.tenses.includes(tense)) {
        const error = new Error(`Некорректное время глагола: "${tense}"`);
        error.status = 400;
        throw error;
    }
}

function validateVerb(params) {
    const { verb, verbText, letter } = params;

    if (!verb) {
        let errorMessage = `Глагол "${verbText}" не найден в базе данных.`;
        if (letter) {
            errorMessage = `Не удалось найти глагол "${verbText}" для буквы "${letter}".`;
        }
        const error = new Error(errorMessage);
        error.status = 404;
        throw error;
    }
}

function validateVerbId(verbId) {
    if (!verbId) {
        const error = new Error('Идентификатор глагола не указан');
        error.status = 400;
        throw error;
    }
}

function validateVerbText(verbText) {
    if (!verbText) {
        const error = new Error('Текст глагола не указан');
        error.status = 400;
        throw error;
    }
}

function validateVerbExistence(verb, existingVerb) {
    if (existingVerb) {
        const error = new Error(`Глагол "${verb}" уже существует`);
        error.status = 400;
        throw error;
    }
    return true;
}

function validateVerbTranslation(translation, verbText) {
    if (!translation) {
        const error = new Error(`Перевод для глагола "${verbText}" не найден.`);
        error.status = 404;
        throw error;
    }
}

function validateVerbTranslationExistence(verb, translation) {
    if (!translation || translation.length === 0) {
        const error = new Error(`Перевод для глагола "${verb}" отсутствует`);
        error.status = 400;
        throw error;
    }
    return true;
}

function validateConjugationsExistence(verb, conjugations) {
    if (!conjugations || Object.keys(conjugations).length === 0) {
        const error = new Error(`Спряжения для глагола "${verb}" отсутствуют`);
        error.status = 400;
        throw error;
    }
    return true;
}

function validateQuery(query) {
    if (!query) {
        const error = new Error('Параметр запроса "q" отсутствует или пустой');
        error.status = 400;
        throw error;
    }
}

function validatePage(page) {
    if (isNaN(page) || page < 1) {
        const error = new Error('Неверный номер страницы');
        error.status = 400;
        throw error;
    }
}

function validatePageRange(page, totalPages) {
    if (page < 1 || page > totalPages) {
        const error = new Error('Страница не найдена');
        error.status = 404;
        throw error
    }
}

function validateVerbTextAndSentence(verbText, sentence) {
    if (!verbText || !sentence) {
        const error = new Error('Глагол и предложение обязательны для проверки');
        error.status = 400;
        throw error;
    }
}

function validateVerbModel(verbModel, letter) {
    if (!verbModel) {
        const error = new Error(`Модель глагола для буквы "${letter}" не найдена.`);
        error.status = 404;
        throw error;
    }
}

function validateVerbSentencesModel(params) {
    //console.log(' validationUtils.js | validateVerbSentencesModel() | params: ', params);
    const { verbSentencesModel, letter, tense } = params;

    if (!verbSentencesModel) {
        const error = new Error(`Модель предложений для буквы "${letter}" и времени "${tense}" не найдена.`);
        error.status = 404;
        throw error;
    }
}

function validateVerbSentencesTranslationModel(params) {
    const { verbSentencesTranslationModel, letter, tense, language } = params;

    if (!verbSentencesTranslationModel) {
        const error = new Error(`Модель переводов предложений для буквы "${letter}", времени "${tense}" и языка "${language}" не найдена.`);
        error.status = 404;
        throw error;
    }
}

function validateSentencesExistence(verb, sentences) {
    if (!sentences || sentences.length === 0) {
        const error = new Error(`Предложения для глагола "${verb}" отсутствуют`);
        error.status = 400;
        throw error;
    }
    return true;
}

function validateSentencesTranslationExistence(verb, sentencesTranslation) {
    if (!sentencesTranslation || sentencesTranslation.length === 0) {
        const error = new Error(`Перевод предложений для глагола "${verb}" отсутствует`);
        error.status = 400;
        throw error;
    }
    return true;
}

function validateAvailableVerbs(availableAlphabetLetters) {
    if (availableAlphabetLetters.length === 0) {
        const error = new Error('Нет доступных глаголов в базе данных.');
        error.status = 404;
        throw error;
    }
}

function validateAvailableVerbsForLetter(letter, count) {
    if (count === 0) {
        const error = new Error(`Нет доступных глаголов для буквы "${letter}".`);
        error.status = 404;
        throw error;
    }
}

module.exports = {
    validateLetter,
    validateLetterFilter,
    validateTense,
    validateVerb,
    validateVerbId,
    validateVerbText,
    validateVerbTranslation,
    validateQuery,
    validatePage,
    validatePageRange,
    validateVerbTextAndSentence,
    validateVerbModel,
    validateVerbSentencesModel,
    validateVerbSentencesTranslationModel,
    validateAvailableVerbs,
    validateAvailableVerbsForLetter,
    validateVerbExistence,
    validateVerbTranslationExistence,
    validateConjugationsExistence,
    validateSentencesExistence,
    validateSentencesTranslationExistence,
};