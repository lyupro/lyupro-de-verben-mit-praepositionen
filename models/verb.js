// models/verb.js
const mongoose = require('mongoose');
const verbTensesConfig = require('../config/verbTenses');
const alphabetConfig = require('../config/alphabet');
const languagesConfig = require('../config/languages');

// Схема для модели Verb
const verbSchema = new mongoose.Schema({
    verb_id: {
        type: Number,
        required: true,
        unique: true,
    },
    verb: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
});

// Схема для модели VerbTranslation
const verbTranslationSchema = new mongoose.Schema({
    verb_id: {
        type: Number,
        ref: 'Verb',
        required: true,
    },
    verb: {
        type: [String],
        required: true,
        trim: true,
        lowercase: true,
    },
});

// Схема для модели VerbTenses
const verbTensesSchema = new mongoose.Schema({
    verb_id: {
        type: Number,
        ref: 'Verb',
        required: true,
    },
    conjugations: {
        ich: { type: String, required: true },
        du: { type: String, required: true },
        'er/sie/es': { type: String, required: true },
        wir: { type: String, required: true },
        ihr: { type: String, required: true },
        'sie/Sie': { type: String, required: true },
    },
});

// Схема для модели VerbSentence
const verbSentenceSchema = new mongoose.Schema({
    verb_id: {
        type: Number,
        ref: 'Verb',
        required: true,
    },
    sentences: {
        type: [{
            sentence_id: {
                type: Number,
                required: true,
            },
            sentence: {
                type: String,
                required: true,
            },
        }],
        required: true,
        validate: {
            validator: function (sentences) {
                return sentences.length >= 1;
            },
            message: 'At least one sentence is required.',
        },
    },
}, { versionKey: false }); // Отключаем поле `__v`

// Схема для модели VerbSentenceTranslation
const verbSentenceTranslationSchema = new mongoose.Schema({
    verb_id: {
        type: Number,
        ref: 'Verb',
        required: true,
    },
    sentences: {
        type: [{
            sentence_id: {
                type: Number,
                required: true,
            },
            sentence: {
                type: String,
                required: true,
            },
        }],
        required: true,
        validate: {
            validator: function (sentences) {
                return sentences.length >= 1;
            },
            message: 'At least one sentence translation is required.',
        },
    },
}, { versionKey: false }); // Отключаем поле `__v`

// Создание объектов моделей для каждой буквы алфавита
const VerbModel = {};
const VerbTranslationModel = {};
const VerbTensesModel = {};
const VerbSentenceModel = {};
const VerbSentenceTranslationModel = {};

// Функция для создания моделей Mongoose
function createModels() {
    alphabetConfig.letters.forEach((letter) => {
        //console.log(`Creating models for letter: ${letter}`);
        VerbModel[letter] = mongoose.model(
            `Verb_${letter}`,
            verbSchema,
            `de_verbs_${letter}`
        );

        VerbTranslationModel[letter] = {};
        languagesConfig.languages.forEach((language) => {
            VerbTranslationModel[letter][language] = mongoose.model(
                `Verb_${letter}_Translation_${language}`,
                verbTranslationSchema,
                `de_verbs_${letter}_translations_${language}`
            );
        });

        VerbTensesModel[letter] = {};
        verbTensesConfig.tenses.forEach((tense) => {
            VerbTensesModel[letter][tense] = mongoose.model(
                `Verb_${letter}_Tenses_${tense}`,
                verbTensesSchema,
                `de_verbs_${letter}_tenses_${tense}`
            );
        });

        VerbSentenceModel[letter] = {};
        //console.log('VerbSentenceModel[letter] before:', VerbSentenceModel[letter]);
        verbTensesConfig.tenses.forEach((tense) => {
            //console.log(`Creating VerbSentenceModel for tense: ${tense}`);
            VerbSentenceModel[letter][tense] = mongoose.model(
                `Verb_${letter}_Sentence_${tense}`,
                verbSentenceSchema,
                `de_verbs_${letter}_sentences_${tense}`
            );
            //console.log('VerbSentenceModel[letter][tense]:', VerbSentenceModel[letter][tense]);
        });
        //console.log('VerbSentenceModel[letter] after:', VerbSentenceModel[letter]);

        VerbSentenceTranslationModel[letter] = {};
        verbTensesConfig.tenses.forEach((tense) => {
            VerbSentenceTranslationModel[letter][tense] = {};
            languagesConfig.languages.forEach((language) => {
                //console.log(`Creating VerbSentenceTranslationModel for tense: ${tense}, language: ${language}`);
                VerbSentenceTranslationModel[letter][tense][language] = mongoose.model(
                    `Verb_${letter}_Sentence_${tense}_${language}`,
                    verbSentenceTranslationSchema,
                    `de_verbs_${letter}_sentences_${tense}_${language}`
                );
            });
        });
    });
}

// Функции для получения моделей Mongoose
function getVerbModel(letter) {
    if (!VerbModel[letter]) {
        throw new Error(`Модель глагола для буквы "${letter}" не найдена.`);
    }
    return VerbModel[letter];
}

function getVerbTranslationModel(letter, language) {
    if (!VerbTranslationModel[letter] || !VerbTranslationModel[letter][language]) {
        throw new Error(`Модель перевода глагола для буквы "${letter}" и языка "${language}" не найдена.`);
    }
    return VerbTranslationModel[letter][language];
}

function getVerbTensesModel(letter, tense) {
    if (!VerbTensesModel[letter] || !VerbTensesModel[letter][tense]) {
        throw new Error(`Модель спряжения глагола для буквы "${letter}" и времени "${tense}" не найдена.`);
    }
    return VerbTensesModel[letter][tense];
}

function getVerbSentencesModel(letter, tense) {
    if (!VerbSentenceModel[letter] || !VerbSentenceModel[letter][tense]) {
        throw new Error(`Модель предложения глагола для буквы "${letter}" и времени "${tense}" не найдена.`);
    }
    return VerbSentenceModel[letter][tense];
}

function getVerbSentencesTranslationModel(letter, tense, language) {
    if (!VerbSentenceTranslationModel[letter] || !VerbSentenceTranslationModel[letter][tense] || !VerbSentenceTranslationModel[letter][tense][language]) {
        throw new Error(`Модель перевода предложений для буквы "${letter}", времени "${tense}" и языка "${language}" не найдена.`);
    }
    return VerbSentenceTranslationModel[letter][tense][language];
}

// Экспорт функций и моделей
module.exports = {
    createModels,
    getVerbModel,
    getVerbTranslationModel,
    getVerbTensesModel,
    getVerbSentencesModel,
    getVerbSentencesTranslationModel,
};