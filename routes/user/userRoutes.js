// routes/user/userRoutes.js
import express from 'express';
import { authenticateJWT } from '../../middleware/auth/authenticateJWT.js';
import { authenticateCookie } from '../../middleware/auth/cookieAuth.js';
import * as favoritesController from './favoritesController.js';
import * as listsController from './listsController.js';
import User from '../../models/user.js';

const router = express.Router();

// View роуты (рендерят HTML страницы) - используем cookie аутентификацию
router.get('/profile', authenticateCookie, async (req, res) => {
    try {
        // Получаем полные данные пользователя из БД
        const user = await User.findById(req.user.id || req.user.userId);
        
        if (!user) {
            return res.status(404).render('error', {
                title: 'Пользователь не найден',
                message: 'Пользователь не найден'
            });
        }

        res.render('user/profile', {
            title: 'Профиль пользователя',
            user: {
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                _id: user._id
            },
            userStyles: true
        });
    } catch (error) {
        console.error('Error loading user profile:', error);
        res.status(500).render('error', {
            title: 'Ошибка сервера',
            message: 'Не удалось загрузить профиль пользователя'
        });
    }
});

// View роуты для favorites и lists (должны быть ПОСЛЕ API роутов)
router.get('/favorites/view', authenticateCookie, async (req, res) => {
    try {
        const user = await User.findById(req.user.id || req.user.userId);
        
        res.render('user/favorites', {
            title: 'Избранные глаголы',
            user: {
                username: user.username,
                email: user.email,
                role: user.role,
                _id: user._id
            },
            userStyles: true
        });
    } catch (error) {
        console.error('Error loading favorites page:', error);
        res.status(500).render('error', {
            title: 'Ошибка сервера',
            message: 'Не удалось загрузить страницу избранного'
        });
    }
});

router.get('/lists/view', authenticateCookie, async (req, res) => {
    try {
        const user = await User.findById(req.user.id || req.user.userId);
        
        res.render('user/lists', {
            title: 'Мои списки глаголов',
            user: {
                username: user.username,
                email: user.email,
                role: user.role,
                _id: user._id
            },
            userStyles: true
        });
    } catch (error) {
        console.error('Error loading lists page:', error);
        res.status(500).render('error', {
            title: 'Ошибка сервера',
            message: 'Не удалось загрузить страницу списков'
        });
    }
});

// Все API роуты требуют JWT аутентификации
router.use(authenticateJWT);

// === ИЗБРАННОЕ ===
// GET /user/favorites - Получить избранные глаголы (API)
router.get('/favorites', favoritesController.getFavorites);

// POST /user/favorites/add - Добавить глагол в избранное
router.post('/favorites/add', favoritesController.addToFavorites);

// DELETE /user/favorites/remove - Удалить глагол из избранного
router.delete('/favorites/remove', favoritesController.removeFromFavorites);

// DELETE /user/favorites/bulk-remove - Массовое удаление из избранного
router.delete('/favorites/bulk-remove', favoritesController.bulkRemoveFromFavorites);

// GET /user/favorites/check - Проверить, в избранном ли глагол
router.get('/favorites/check', favoritesController.checkFavorite);

// GET /user/favorites/stats - Получить статистику избранного
router.get('/favorites/stats', favoritesController.getFavoritesStats);

// === СПИСКИ ГЛАГОЛОВ ===
// GET /user/lists - Получить все списки пользователя (API)
router.get('/lists', listsController.getLists);

// POST /user/lists - Создать новый список
router.post('/lists', listsController.createList);

// GET /user/lists/:id - Получить конкретный список с глаголами
router.get('/lists/:id', listsController.getListById);

// PUT /user/lists/:id - Обновить список
router.put('/lists/:id', listsController.updateList);

// DELETE /user/lists/:id - Удалить список
router.delete('/lists/:id', listsController.deleteList);

// POST /user/lists/:id/verbs - Добавить глагол в список
router.post('/lists/:id/verbs', listsController.addVerbToList);

// DELETE /user/lists/:id/verbs/:verbItemId - Удалить глагол из списка
router.delete('/lists/:id/verbs/:verbItemId', listsController.removeVerbFromList);

export default router; 