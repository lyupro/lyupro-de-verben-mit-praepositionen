// seeds/seed-verbs_sentence.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const { getVerbSentencesModel, getVerbSentencesTranslationModel, createModels } = require('../models/verb');

const letter = process.argv[2] || 'a';
const tense = process.argv[3] || 'present';
const language = process.argv[4] || 'ru';

const seedDataPath = `../!db/de_verbs_${letter}_sentences_${tense}`;
const seedDataTranslationPath = `../!db/de_verbs_${letter}_sentences_${tense}_${language}`;

const seedData = {
    sentences: require(`${seedDataPath}.json`),
    sentencesTranslation: require(`${seedDataTranslationPath}.json`),
};

mongoose.connect('mongodb://localhost/deVerbsApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        try {
            console.log('Connected to MongoDB');

            // Создание моделей перед попыткой заполнения базы данных
            await createModels();

            const SentencesModel = getVerbSentencesModel(letter, tense);
            console.log('SentencesModel:', SentencesModel);
            const SentencesTranslationModel = getVerbSentencesTranslationModel(letter, tense, language);
            console.log('SentencesTranslationModel:', SentencesTranslationModel);

            // Удаление существующих данных
            await SentencesModel.deleteMany({});
            await SentencesTranslationModel.deleteMany({});

            // Заполнение базы данных новыми данными
            for (const sentenceData of seedData.sentences) {
                const sentences = sentenceData.sentences.map((sentence, index) => ({
                    sentence_id: index + 1,
                    sentence: sentence.sentence,
                }));

                await SentencesModel.create({
                    verb_id: sentenceData.verb_id,
                    sentences,
                });
            }

            for (const translationData of seedData.sentencesTranslation) {
                const sentences = translationData.sentences.map((sentence, index) => ({
                    sentence_id: index + 1,
                    sentence: sentence.sentence,
                }));

                await SentencesTranslationModel.create({
                    verb_id: translationData.verb_id,
                    sentences,
                });
            }

            console.log('Database seeded successfully');
            process.exit(0);
        } catch (error) {
            console.error('Error seeding database:', error);
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    });