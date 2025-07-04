// utils/verbUtils.js
import {
    getVerbModel,
    getVerbTranslationModel,
    getVerbTensesModel,
    getVerbSentencesModel,
    getVerbSentencesTranslationModel,
} from '../models/verb.js';
import alphabetConfig from '../config/alphabet.js';
import verbTensesConfig from '../config/verbTenses.js';
import {
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
} from './validationUtils.js';
import {
    updateVerbData,
    updateTranslationData,
    updateTensesData,
    updateSentencesData,
    updateSentencesTranslationData,
} from './verbUtilsUpdate.js';
import { deleteVerbData } from './verbUtilsDelete.js';

async function getAlphabetWithAvailability() {
    try {
        const enableLetterFilter = validateLetterFilter();

        // Создаем объект для хранения информации о доступности букв
        const letterAvailability = {};

        if (enableLetterFilter) {
            // Проверяем доступность каждой буквы
            for (const letter of alphabetConfig.getAll()) {
                const VerbModel = getVerbModel(letter);
                const count = await VerbModel.countDocuments();
                letterAvailability[letter] = count > 0;
            }
        } else {
            // Если фильтр отключен, помечаем все буквы как доступные
            alphabetConfig.getAll().forEach(letter => {
                letterAvailability[letter] = true;
            });
        }

        return { alphabet: alphabetConfig.getAll(), letterAvailability };
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
        for (const letter of alphabetConfig.getAll()) {
            const VerbModel = getVerbModel(letter);
            const count = await VerbModel.countDocuments();
            letterCounts[letter] = count;
            totalVerbs += count;
        }

        const totalPages = Math.ceil(totalVerbs / limit);

        validatePageRange(page, totalPages);

        let currentCount = 0;
        let currentSkip = skip;
        for (const letter of alphabetConfig.getAll()) {
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
    let verb;
    try {
        const verbModel = getVerbModel(letter);
        validateVerbModel(verbModel, letter);

        if (random) {
            const count = await verbModel.countDocuments();
            validateAvailableVerbsForLetter(letter, count);

            const randomIndex = Math.floor(Math.random() * count);
            verb = await verbModel.findOne().skip(randomIndex);
            //console.log('getVerbData() | Selected Random verb:', verb);
            // Для случайного глагола проверяем только сам verb и letter
            validateVerb({ verb, letter });
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

        for (const tense of verbTensesConfig.tenses) {
            //console.log('getVerbData() | tense: ', tense);
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
        // Для случайного глагола показываем verb.verb вместо пустого verbText
        const displayText = random && verb ? verb.verb : verbText;
        throw new Error(`Ошибка при получении данных для глагола "${displayText}": ${error.message}`);
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

        //console.log('verbUtils.js | createVerb() | translation: ', translation);
        const translationAdded = validateVerbTranslationExistence(verb, translation);
        //console.log('verbUtils.js | createVerb() | translationAdded: ', translationAdded);
        if (translationAdded) {
            const translationModel = getVerbTranslationModel(letter, 'ru');
            await translationModel.create({
                verb_id: newVerb.verb_id,
                translations: translation,
            });
        }

        //console.log('verbUtils.js | createVerb() | conjugations: ', conjugations);
        const validConjugations = validateConjugationsExistence(verb, conjugations);
        //console.log('verbUtils.js | createVerb() | validConjugations: ', validConjugations);
        for (const tense of verbTensesConfig.tenses) {
            if (validConjugations[tense] && Object.keys(validConjugations[tense]).length > 0) {
                const tensesModel = getVerbTensesModel(letter, tense);
                await tensesModel.create({
                    verb_id: newVerb.verb_id,
                    conjugations: validConjugations[tense],
                });
            }
        }

        console.log('verbUtils.js | createVerb() | sentences: ', sentences);
        const sentencesAdded = validateSentencesExistence(verb, sentences);
        if (sentencesAdded) {
            console.log('verbUtils.js | createVerb() | sentencesAdded: ', sentencesAdded);
            const sentencesModel = getVerbSentencesModel(letter, 'present');
            const newSentences = sentences.map((sentence, index) => ({
                sentence_id: index,
                sentence: sentence,
            }));
            await sentencesModel.create({
                verb_id: newVerb.verb_id,
                tense: 'present',
                sentences: newSentences,
            });
        }

        const sentencesTranslationAdded = validateSentencesTranslationExistence(verb, sentencesTranslation);
        if (sentencesTranslationAdded) {
            const sentencesTranslationModel = getVerbSentencesTranslationModel(letter, 'present', 'ru');
            const newSentencesTranslation = sentencesTranslation.map((translation, index) => ({
                sentence_id: index,
                sentence: translation,
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
            await deleteVerbData(letter, newVerb.verb_id);
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
        const verbData = await VerbModel.findOne({ verb });

        await deleteVerbData(letter, verbData.verb_id);

        if (!verbData) {
            throw new Error(`Глагол "${verb}" не найден.`);
        }

        return verbData;
    } catch (error) {
        console.error('Ошибка при удалении глагола:', error);
        throw error;
    }
}

export {
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