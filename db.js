// db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

function logConnection(message) {
    if (process.env.APP_ENV === 'development' && process.env.APP_DEBUG === 'true') {
        console.log(message, process.env.MONGO_URI);
    } else {
        console.log(message);
    }
}

export async function connectToDatabase() {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not defined in environment variables');
    }
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logConnection('Mongoose connected to');
    } catch (err) {
        console.error('Mongoose connection error:', err);
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