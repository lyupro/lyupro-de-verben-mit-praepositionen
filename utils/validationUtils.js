// utils/validationUtils.js
import alphabetConfig from '../config/alphabet.js';
import verbTensesConfig from '../config/verbTenses.js';

function validateLetter(letter) {
    if (!letter || !alphabetConfig.getAll().includes(letter)) {
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
    if (verbId === undefined || verbId === null || verbId === '') {
        const error = new Error('Идентификатор глагола не указан');
        error.status = 400;
        throw error;
    }
    
    // Проверяем что это число (включая 0)
    if (typeof verbId !== 'number' && !Number.isInteger(Number(verbId))) {
        const error = new Error('Идентификатор глагола должен быть числом');
        error.status = 400;
        throw error;
    }
    
    // Проверяем что это не отрицательное число
    if (Number(verbId) < 0) {
        const error = new Error('Идентификатор глагола не может быть отрицательным');
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
    if (totalPages === 0) {
        return true;
    }
    
    if (page < 1 || page > totalPages) {
        throw new Error('Страница не найдена');
    }
    
    return true;
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

function validateAvailableVerbs(verbs) {
    if (!verbs || verbs.length === 0) {
        return [];
    }
    
    return verbs;
}

function validateAvailableVerbsForLetter(letter, count) {
    if (count === 0) {
        const error = new Error(`Нет доступных глаголов для буквы "${letter}".`);
        error.status = 404;
        throw error;
    }
}

function validateVerbTranslationExistence(verb, translation) {
    if (translation === undefined || (Array.isArray(translation) && translation.length === 0)) {
        const error = new Error(`Перевод для глагола "${verb}" отсутствует`);
        error.status = 400;
        throw error;
    }

    return true;
}

// We could split it into 2 separate functions, but instead of copying the same code parts, I decided to let it in 1
function validateConjugationsExistence(verb, conjugations) {
    if (conjugations === undefined || (typeof conjugations === 'object' && Object.keys(conjugations).length === 0)) {
        const error = new Error(`Спряжения для глагола "${verb}" отсутствуют`);
        error.status = 400;
        throw error;
    }

    const validConjugations = {};
    let hasNonEmptyConjugation = false;

    for (const tense in conjugations) {
        const tenseConjugations = conjugations[tense];
        if (
            tenseConjugations === undefined ||
            (typeof tenseConjugations === 'object' && Object.keys(tenseConjugations).length === 0)
        ) {
            continue;
        }

        validConjugations[tense] = {};

        for (const pronoun in tenseConjugations) {
            const conjugation = tenseConjugations[pronoun];
            if (conjugation !== undefined && conjugation.trim() !== '') {
                validConjugations[tense][pronoun] = conjugation;
                hasNonEmptyConjugation = true;
            }
        }
    }

    if (!hasNonEmptyConjugation) {
        const error = new Error(`Все поля спряжений для глагола "${verb}" пустые`);
        error.status = 400;
        throw error;
    }

    return validConjugations;
}

function validateSentencesExistence(verb, sentences) {
    if (sentences === undefined || (Array.isArray(sentences) && sentences.length === 0)) {
        //const error = new Error(`Предложения для глагола "${verb}" отсутствуют`);
        //error.status = 400;
        //throw error;
        return false;
    }

    return true;
}

function validateSentencesTranslationExistence(verb, sentencesTranslation) {
    if (sentencesTranslation === undefined || (Array.isArray(sentencesTranslation) && sentencesTranslation.length === 0)) {
        //const error = new Error(`Перевод предложений для глагола "${verb}" отсутствует`);
        //error.status = 400;
        //throw error;
        return false;
    }

    return true;
}

export {
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
