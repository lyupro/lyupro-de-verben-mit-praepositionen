// db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

function logConnection(message) {
    if (process.env.APP_ENV === 'development' && process.env.APP_DEBUG === 'true') {
        console.log(message, getMongoURI());
    } else {
        console.log(message);
    }
}

// Функция для получения URI базы данных (поддержка как MONGO_URI, так и MONGODB_URI)
function getMongoURI() {
    return process.env.MONGODB_URI || process.env.MONGO_URI;
}

export async function connectToDatabase() {
    const mongoURI = getMongoURI();
    if (!mongoURI) {
        throw new Error('MONGO_URI or MONGODB_URI is not defined in environment variables');
    }
    try {
        await mongoose.connect(mongoURI);
        logConnection('Mongoose connected to');
    } catch (err) {
        console.error('Mongoose connection error:', err);
        throw err;
    }
}

// Функция для отключения от базы данных (для тестов)
export async function disconnectFromDatabase() {
    try {
        await mongoose.disconnect();
        console.log('Mongoose disconnected');
    } catch (err) {
        console.error('Error during mongoose disconnect:', err);
        throw err;
    }
}

// Обработка событий подключения
const db = mongoose.connection;

db.on('connected', () => logConnection('Mongoose connected to'));
db.on('error', (err) => console.error('Mongoose connection error:', err));
db.on('disconnected', () => console.log('Mongoose disconnected'));

// Обработка сигналов завершения процесса
process.on('SIGINT', async () => {
    try {
        await db.close();
        console.log('Mongoose disconnected through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error during mongoose disconnect:', err);
        process.exit(1);
    }
});