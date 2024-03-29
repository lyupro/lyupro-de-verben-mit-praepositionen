// models/verb.js
const mongoose = require('mongoose');
const verbTensesConfig = require('../config/verbTenses');
const alphabetConfig = require('../config/alphabet');

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
    tense: {
        type: String,
        enum: verbTensesConfig.tenses,
        required: true,
    },
    sentences: {
        type: [String],
        required: true,
        validate: {
            validator: function (sentences) {
                return sentences.length >= 1;
            },
            message: 'At least one sentence is required.',
        },
    },
});

// Создание объектов моделей для каждой буквы алфавита
const VerbModel = {};
const VerbTensesModel = {};
const VerbSentenceModel = {};

// Функция для создания моделей Mongoose
function createModels() {
    alphabetConfig.letters.forEach((letter) => {
        VerbModel[letter] = mongoose.model(
            `Verb_${letter}`,
            verbSchema,
            `de_verbs_${letter}`
        );

        VerbTensesModel[letter] = {};
        verbTensesConfig.tenses.forEach((tense) => {
            VerbTensesModel[letter][tense] = mongoose.model(
                `Verb_${letter}_Tenses_${tense}`,
                verbTensesSchema,
                `de_verbs_${letter}_tenses_${tense}`
            );
        });

        VerbSentenceModel[letter] = {};
        verbTensesConfig.tenses.forEach((tense) => {
            VerbSentenceModel[letter][tense] = mongoose.model(
                `Verb_${letter}_Sentence_${tense}`,
                verbSentenceSchema,
                `de_verbs_${letter}_sentences_${tense}`
            );
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

// Экспорт функций и моделей
module.exports = {
    createModels,
    getVerbModel,
    getVerbTensesModel,
    getVerbSentencesModel,
};