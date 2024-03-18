// ./models/verb.js
const mongoose = require('mongoose');

// Определение схемы Verb
const verbSchema = new mongoose.Schema({
    verb: String,
    translation: String,
    sentences: [String]
});

// Создание модели Verb на основе схемы
const Verb = mongoose.model('Verb', verbSchema);

module.exports = Verb;