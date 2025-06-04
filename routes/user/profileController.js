import express from 'express';
import { authenticateJWT } from '../../middleware/auth/authenticateJWT.js';
import User from '../../models/user.js';

const router = express.Router();

// GET /user/profile - Отображение профиля пользователя
router.get('/profile', authenticateJWT, async (req, res) => {
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

// GET /user/favorites - Отображение страницы избранного
router.get('/favorites', authenticateJWT, async (req, res) => {
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

// GET /user/lists - Отображение страницы списков
router.get('/lists', authenticateJWT, async (req, res) => {
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

// GET /user/lists/:id - Отображение детальной страницы списка
router.get('/lists/:id', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.id || req.user.userId);
        
        res.render('user/listDetail', {
            title: 'Список глаголов',
            user: {
                username: user.username,
                email: user.email,
                role: user.role,
                _id: user._id
            },
            listId: req.params.id,
            userStyles: true
        });
    } catch (error) {
        console.error('Error loading list detail page:', error);
        res.status(500).render('error', {
            title: 'Ошибка сервера',
            message: 'Не удалось загрузить детали списка'
        });
    }
});

export default router; 