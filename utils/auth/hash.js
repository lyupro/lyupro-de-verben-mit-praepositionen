// utils/auth/hash.js
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Увеличиваем количество раундов для большей безопасности

export const hashPassword = async (password) => {
    try {
        return await bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Error hashing password');
    }
};

export const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        console.error('Error comparing passwords:', error);
        throw new Error('Error comparing passwords');
    }
};