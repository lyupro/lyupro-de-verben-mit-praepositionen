// utils/verbUpdateUtils.js
const {
    getVerbModel,
    getVerbTranslationModel,
    getVerbTensesModel,
    getVerbSentencesModel,
    getVerbSentencesTranslationModel,
} = require('../models/verb');

async function updateVerbData(letter, verb) {
    const VerbModel = getVerbModel(letter);
    const verbData = await VerbModel.findOneAndUpdate({ verb }, { verb }, { new: true });

    if (!verbData) {
        throw new Error(`Глагол "${verb}" не найден.`);
    }

    return verbData;
}

async function updateTranslationData(letter, verbId, translation) {
    const translationModel = getVerbTranslationModel(letter, 'ru');
    const updatedTranslationData = await translationModel.findOneAndUpdate(
        { verb_id: verbId },
        { verb: translation },
        { new: true, upsert: true }
    );

    return updatedTranslationData;
}

async function updateTensesData(letter, verbId, conjugations) {
    const tensesModels = {};
    const updatedConjugations = {};

    for (const tense in conjugations) {
        tensesModels[tense] = getVerbTensesModel(letter, tense);
        const existingTensesData = await tensesModels[tense].findOne({ verb_id: verbId });

        updatedConjugations[tense] = conjugations[tense] || (existingTensesData ? existingTensesData.conjugations[tense] : {});

        await tensesModels[tense].findOneAndUpdate(
            { verb_id: verbId },
            { $set: { [`conjugations.${tense}`]: updatedConjugations[tense] } },
            { new: true, upsert: true }
        );
    }
    console.log('updateSentencesData() | updatedConjugations: ', updatedConjugations);

    return updatedConjugations;
}

async function updateSentencesData(letter, verbId, sentences) {
    const sentencesModel = getVerbSentencesModel(letter, 'present');
    //console.log('updateSentencesData() | sentencesModel: ', sentencesModel);

    // Удаляем пробелы в начале и конце каждого предложения
    const trimmedSentences = sentences.map(sentenceObj => ({
        ...sentenceObj,
        sentence: sentenceObj.sentence.trim()
    }));
    //console.log('updateSentencesData() | trimmedSentences: ', trimmedSentences);

    // Обновляем предложения в базе данных
    await sentencesModel.updateOne(
        { verb_id: verbId },
        { $set: { sentences: trimmedSentences } },
        { upsert: true }
    );

    // Получаем обновленные предложения из базы данных
    const updatedSentences = await sentencesModel.findOne({ verb_id: verbId });
    //console.log('updateSentencesData() | updatedSentences: ', updatedSentences);

    return { newSentences: trimmedSentences, mergedSentences: updatedSentences?.sentences || [] };
}

async function updateSentencesTranslationData(letter, verbId, sentencesTranslation) {

    const sentencesTranslationModel = getVerbSentencesTranslationModel(letter, 'present', 'ru');
    //console.log('updateSentencesTranslationData() | sentencesTranslationModel: ', sentencesTranslationModel);

    // Удаляем пробелы в начале и конце каждого перевода предложения
    const trimmedSentencesTranslation = sentencesTranslation.map(translationObj => ({
        ...translationObj,
        sentence: translationObj.sentence.trim()
    }));
    //console.log('updateSentencesTranslationData() | trimmedSentencesTranslation: ', trimmedSentencesTranslation);

    // Обновляем переводы предложений в базе данных
    await sentencesTranslationModel.updateOne(
        { verb_id: verbId },
        { $set: { sentences: trimmedSentencesTranslation } },
        { upsert: true }
    );

    // Получаем обновленные переводы предложений из базы данных
    const updatedTranslations = await sentencesTranslationModel.findOne({ verb_id: verbId });
    //console.log('updateSentencesTranslationData() | updatedTranslations: ', updatedTranslations);

    return { newSentencesTranslation: trimmedSentencesTranslation, mergedTranslations: updatedTranslations?.sentences || [] };
}

module.exports = {
    updateVerbData,
    updateTranslationData,
    updateTensesData,
    updateSentencesData,
    updateSentencesTranslationData,
};