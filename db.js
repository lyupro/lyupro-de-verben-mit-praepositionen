// db.js
const mongoose = require('mongoose');
const config = require('./config');

// Подключение к MongoDB
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Обработка событий подключения
const db = mongoose.connection;

db.on('connected', () => {
    if(process.env.APP_ENV === 'development' && process.env.APP_DEBUG === 'true'){
        console.log('Mongoose connected to', config.mongoURI);
    }else{
        console.log('Mongoose connected');
    }
});

db.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

db.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// Обработка сигналов завершения процесса
process.on('SIGINT', () => {
    db.close(() => {
        console.log('Mongoose disconnected through app termination');
        process.exit(0);
    });
});

//module.exports = db;