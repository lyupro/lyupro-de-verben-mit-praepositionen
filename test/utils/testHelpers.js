import jwt from 'jsonwebtoken';
import User from '../../models/user.js';
import UserFavorites from '../../models/userFavorites.js';
import UserVerbLists from '../../models/userVerbLists.js';
import UserVerbListItems from '../../models/userVerbListItems.js';

/**
 * Создает тестового пользователя с JWT токеном
 */
export async function createTestUser(userData = {}) {
    const defaultUserData = {
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
        role: 'user'
    };

    const user = new User({ ...defaultUserData, ...userData });
    await user.save();

    const token = jwt.sign(
        { 
            id: user._id, 
            username: user.username, 
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return { user, token };
}

/**
 * Создает админа с JWT токеном
 */
export async function createTestAdmin(userData = {}) {
    const adminData = {
        username: 'testadmin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'administrator',
        ...userData
    };

    return await createTestUser(adminData);
}

/**
 * Создает тестовое избранное для пользователя
 */
export async function createTestFavorite(userId, favoriteData = {}) {
    const defaultData = {
        userId,
        letter: 'a',
        verbId: 1,
        verbText: 'arbeiten'
    };

    const favorite = new UserFavorites({ ...defaultData, ...favoriteData });
    await favorite.save();
    return favorite;
}

/**
 * Создает тестовый список глаголов для пользователя
 */
export async function createTestVerbList(userId, listData = {}) {
    const defaultData = {
        userId,
        name: 'Test List',
        description: 'A test verb list',
        isPublic: false
    };

    const list = new UserVerbLists({ ...defaultData, ...listData });
    await list.save();
    return list;
}

/**
 * Добавляет глагол в список
 */
export async function addVerbToList(listId, verbData = {}) {
    const defaultData = {
        listId,
        letter: 'a',
        verbId: 1,
        verbText: 'arbeiten'
    };

    const item = new UserVerbListItems({ ...defaultData, ...verbData });
    await item.save();
    return item;
}

/**
 * Очищает все тестовые данные
 */
export async function cleanTestData() {
    await Promise.all([
        User.deleteMany({ email: { $regex: /test.*@test\.com/ } }),
        UserFavorites.deleteMany({}),
        UserVerbLists.deleteMany({}),
        UserVerbListItems.deleteMany({})
    ]);
}

/**
 * Создает множественных пользователей для тестирования
 */
export async function createMultipleTestUsers(count = 3) {
    const users = [];
    for (let i = 0; i < count; i++) {
        const userData = {
            username: `testuser${i}`,
            email: `test${i}@test.com`,
            password: 'password123'
        };
        const { user, token } = await createTestUser(userData);
        users.push({ user, token });
    }
    return users;
}

/**
 * Создает тестовые данные для пользователя (избранное + списки)
 */
export async function setupUserData(userId, options = {}) {
    const { favoritesCount = 3, listsCount = 2, verbsPerList = 2 } = options;
    
    // Создаем избранное
    const favorites = [];
    for (let i = 0; i < favoritesCount; i++) {
        const favorite = await createTestFavorite(userId, {
            letter: String.fromCharCode(97 + i), // a, b, c...
            verbId: i + 1,
            verbText: `verb${i + 1}`
        });
        favorites.push(favorite);
    }

    // Создаем списки
    const lists = [];
    for (let i = 0; i < listsCount; i++) {
        const list = await createTestVerbList(userId, {
            name: `Test List ${i + 1}`,
            description: `Description for list ${i + 1}`,
            isPublic: i % 2 === 0 // первый список публичный, второй приватный
        });

        // Добавляем глаголы в список
        const listItems = [];
        for (let j = 0; j < verbsPerList; j++) {
            const item = await addVerbToList(list._id, {
                letter: String.fromCharCode(97 + j + i * verbsPerList),
                verbId: j + 1 + i * verbsPerList,
                verbText: `listverb${j + 1 + i * verbsPerList}`
            });
            listItems.push(item);
        }

        lists.push({ list, items: listItems });
    }

    return { favorites, lists };
}

/**
 * Ждет заданное время (для тестирования таймаутов)
 */
export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Создает множественные запросы для тестирования concurrency
 */
export async function makeConcurrentRequests(requestFunction, count = 5) {
    const promises = Array(count).fill().map(() => requestFunction());
    return await Promise.all(promises);
}

/**
 * Проверяет что объект содержит только указанные поля
 */
export function expectOnlyFields(obj, allowedFields) {
    const actualFields = Object.keys(obj);
    const unexpectedFields = actualFields.filter(field => !allowedFields.includes(field));
    
    if (unexpectedFields.length > 0) {
        throw new Error(`Unexpected fields found: ${unexpectedFields.join(', ')}`);
    }
}

/**
 * Создает JWT токен с указанными данными
 */
export function createCustomToken(payload, options = {}) {
    const defaultOptions = { expiresIn: '1h' };
    return jwt.sign(payload, process.env.JWT_SECRET, { ...defaultOptions, ...options });
}

/**
 * Создает истекший JWT токен
 */
export function createExpiredToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1h' });
}

/**
 * Генерирует случайную строку для тестов
 */
export function generateRandomString(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Проверяет валидность JWT токена без верификации
 */
export function isValidJWTFormat(token) {
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
} 