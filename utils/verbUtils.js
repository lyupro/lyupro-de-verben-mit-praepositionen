// utils/verbUtils.js
const {
    getVerbModel,
    getVerbTranslationModel,
    getVerbTensesModel,
    getVerbSentencesModel,
    getVerbSentencesTranslationModel,
} = require('../models/verb');
const alphabetConfig = require('../config/alphabet');
const {
    validateLetter,
    validateLetterFilter,
    validateTense,
    validateVerbId,
    validateVerbText,
    validateVerbTranslation,
    validatePage,
    validatePageRange,
    validateVerbModel,
    validateVerbSentencesModel,
    validateVerbSentencesTranslationModel,
    validateAvailableVerbsForLetter,
    validateVerb,
    validateVerbExistence,
    validateVerbTranslationExistence,
    validateConjugationsExistence,
    validateSentencesExistence,
    validateSentencesTranslationExistence,
} = require('./validationUtils');
const {
    updateVerbData,
    updateTranslationData,
    updateTensesData,
    updateSentencesData,
    updateSentencesTranslationData,
} = require('./verbUpdateUtils');

async function getAlphabetWithAvailability() {
    try {
        const enableLetterFilter = validateLetterFilter();

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

    if (translation && translation.translations.length > 0) {
        const translations = translation.translations;
        //console.log('utils/verbUtils.js | getVerbTranslation() | translations: ', translations);
        const firstTranslation = translation.translations[0];
        //console.log('utils/verbUtils.js | getVerbTranslation() | firstTranslation: ', firstTranslation);
        const [mainTranslation, additionalInfo] = firstTranslation.split(/\s+(?=\()/);
        const displayTranslation = mainTranslation.trim();
        //console.log('utils/verbUtils.js | getVerbTranslation() | displayTranslation: ', displayTranslation);
        const tooltipText = additionalInfo ? additionalInfo.replace(/[()]/g, '').trim() : '';
        //console.log('utils/verbUtils.js | getVerbTranslation() | tooltipText: ', tooltipText);
        return { displayTranslation, tooltipText, translations };
    } else {
        return { displayTranslation: 'Перевод недоступен', tooltipText: '', translations: [] };
    }
}

async function getVerbSentences(letter, tense, verbId) {
    try {
        validateLetter(letter);
        validateTense(tense);
        validateVerbId(verbId);

        const verbSentencesModel = getVerbSentencesModel(letter, tense);
        validateVerbSentencesModel({
            verbSentencesModel,
            letter,
            tense,
        });

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

        validateVerbSentencesTranslationModel({
            verbSentencesTranslationModel,
            letter,
            tense,
            language,
        });

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
        validatePage(page);

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

        validatePageRange(page, totalPages);

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
        validateVerbModel(verbModel, letter);

        let verb;
        if (random) {
            const count = await verbModel.countDocuments();
            validateAvailableVerbsForLetter(letter, count);

            const randomIndex = Math.floor(Math.random() * count);
            verb = await verbModel.findOne().skip(randomIndex);
            //console.log('getVerbData() | Selected Random verb:', verb);
            validateVerb({ verb, verbText, letter });
        } else {
            validateVerbText(verbText);

            verb = await verbModel.findOne({ verb: verbText });
            //console.log('getVerbData() | Selected verb:', verb);
            validateVerb({ verb, verbText});
        }

        const translation = await getVerbTranslation(letter, 'ru', verb.verb_id);
        //console.log('getVerbData() | translation: ', translation);
        validateVerbTranslation(translation);

        const conjugations = {};
        const requiredTenses = ['present']; // Добавьте другие времена в этот массив

        for (const tense of requiredTenses) {
            const tenseData = await getVerbTensesModel(letter, tense).findOne({ verb_id: verb.verb_id });
            //console.log('getVerbData() | tenseData: ', tenseData);
            conjugations[tense] = tenseData ? tenseData.conjugations : {};
        }
        //console.log('getVerbData() | conjugations: ', conjugations);

        const sentences = await getVerbSentences(letter, 'present', verb.verb_id);
        //console.log('getVerbData() | sentences: ', sentences);
        const sentencesTranslation = await getVerbSentencesTranslation(letter, 'present', 'ru', verb.verb_id);
        //console.log('getVerbData() | sentencesTranslation: ', sentencesTranslation);

        return {
            verb,
            translation,
            conjugations,
            sentences,
            sentencesTranslation,
        };
    } catch (error) {
        throw new Error(`Ошибка при получении данных для глагола "${verbText}": ${error.message}`);
    }
}

async function createVerb(verb, letter, translation, conjugations, sentences, sentencesTranslation) {
    let newVerb;

    try {
        const verbModel = getVerbModel(letter);
        const existingVerb = await verbModel.findOne({ verb });
        validateVerbExistence(verb, existingVerb);

        // Получаем максимальный verb_id из базы данных
        const maxVerbId = await verbModel.findOne({}, { verb_id: 1, _id: 0 }).sort({ verb_id: -1 }).exec();
        console.log('verbUtils.js | createVerb() | maxVerbId: ', maxVerbId);
        const newVerbId = maxVerbId ? maxVerbId.verb_id + 1 : 0;
        console.log('verbUtils.js | createVerb() | newVerbId: ', newVerbId);

        newVerb = await verbModel.create({ verb_id: newVerbId, verb });
        console.log('verbUtils.js | createVerb() | newVerb 1: ', newVerb);

        const translationAdded = translation ? validateVerbTranslationExistence(verb, translation) : false;
        if (translationAdded) {
            const translationModel = getVerbTranslationModel(letter, 'ru');
            await translationModel.create({
                verb_id: newVerb.verb_id,
                translations: translation,
            });
        }

        const conjugationsAdded = conjugations ? validateConjugationsExistence(verb, conjugations) : false;
        if (conjugationsAdded) {
            const tensesModel = getVerbTensesModel(letter, 'present');
            await tensesModel.create({
                verb_id: newVerb.verb_id,
                conjugations,
            });
        }

        const sentencesAdded = sentences ? validateSentencesExistence(verb, sentences) : false;
        if (sentencesAdded) {
            const sentencesModel = getVerbSentencesModel(letter, 'present');
            const newSentences = sentences.map((sentence, index) => ({
                sentence_id: index + 1,
                sentence: sentence.sentence,
            }));
            await sentencesModel.create({
                verb_id: newVerb.verb_id,
                tense: 'present',
                sentences: newSentences,
            });
        }

        const sentencesTranslationAdded = sentencesTranslation ? validateSentencesTranslationExistence(verb, sentencesTranslation) : false;
        if (sentencesTranslationAdded) {
            const sentencesTranslationModel = getVerbSentencesTranslationModel(letter, 'present', 'ru');
            const newSentencesTranslation = sentencesTranslation.map((translation, index) => ({
                sentence_id: index + 1,
                sentence: translation.sentence,
            }));
            await sentencesTranslationModel.create({
                verb_id: newVerb.verb_id,
                sentences: newSentencesTranslation,
            });
        }

        return newVerb;
    } catch (error) {
        console.log('verbUtils.js | createVerb() | error: ', error);
        console.log('verbUtils.js | createVerb() | newVerb 2: ', newVerb);
        if (newVerb) {
            console.log('verbUtils.js | createVerb() | newVerb 3: ', newVerb);
            const verbModel = getVerbModel(letter);
            await verbModel.deleteOne({ _id: newVerb._id });
            console.warn(`Глагол "${verb}" удален из-за ошибки: ${error.message}`);
        }
        console.error('Ошибка при создании глагола:', error);
        throw error;
    }
}

async function updateVerb(letter, verb, translation, conjugations, sentences, sentencesTranslation) {
    try {
        validateLetter(letter);
        validateVerbText(verb);
        //console.log('updateVerb() | sentences: ', sentences);
        //console.log('updateVerb() | sentencesTranslation: ', sentencesTranslation);

        const verbData = await updateVerbData(letter, verb);
        //console.log('updateVerb() | verbData: ', verbData);
        const updatedTranslationData = await updateTranslationData(letter, verbData.verb_id, translation);
        console.log('updateVerb() | updatedTranslationData: ', updatedTranslationData);
        const updatedTensesData = await updateTensesData(letter, verbData.verb_id, conjugations);
        //console.log('updateVerb() | updatedTensesData: ', updatedTensesData);
        const { newSentences, mergedSentences } = await updateSentencesData(letter, verbData.verb_id, sentences);
        const { newSentencesTranslation, mergedTranslations } = await updateSentencesTranslationData(letter, verbData.verb_id, sentencesTranslation);

        // Don't know, do I need it or not
        if (newSentences.length === 0 && newSentencesTranslation.length === 0) {
            throw new Error('Предложения и их переводы не могут быть пустыми.');
        }

        return {
            translation: updatedTranslationData,
            conjugations: updatedTensesData,
            sentences: mergedSentences,
            sentencesTranslation: mergedTranslations,
        };
    } catch (error) {
        console.error('Ошибка при обновлении глагола:', error);
        throw error;
    }
}

async function deleteVerb(letter, verb) {
    try {
        validateLetter(letter);
        validateVerbText(verb);

        const VerbModel = getVerbModel(letter);
        const verbData = await VerbModel.findOneAndDelete({ verb });

        if (!verbData) {
            throw new Error(`Глагол "${verb}" не найден.`);
        }

        const translationModel = getVerbTranslationModel(letter, 'ru');
        await translationModel.deleteOne({ verb_id: verbData.verb_id });

        const tensesModel = getVerbTensesModel(letter, 'present');
        await tensesModel.deleteOne({ verb_id: verbData.verb_id });

        const sentencesModel = getVerbSentencesModel(letter, 'present');
        await sentencesModel.deleteOne({ verb_id: verbData.verb_id });

        const sentencesTranslationModel = getVerbSentencesTranslationModel(letter, 'present', 'ru');
        await sentencesTranslationModel.deleteOne({ verb_id: verbData.verb_id });

        return verbData;
    } catch (error) {
        console.error('Ошибка при удалении глагола:', error);
        throw error;
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
    createVerb,
    updateVerb,
    deleteVerb,
};