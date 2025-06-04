import express from 'express';
import { authenticateJWT } from '../../middleware/auth/authenticateJWT.js';

const router = express.Router();

// GET /user/profile - Отображение профиля пользователя
router.get('/profile', authenticateJWT, (req, res) => {
    res.render('user/profile', {
        title: 'Профиль пользователя',
        user: req.user,
        userStyles: true
    });
});

// GET /user/favorites - Отображение страницы избранного
router.get('/favorites', authenticateJWT, (req, res) => {
    res.render('user/favorites', {
        title: 'Избранные глаголы',
        user: req.user,
        userStyles: true
    });
});

// GET /user/lists - Отображение страницы списков
router.get('/lists', authenticateJWT, (req, res) => {
    res.render('user/lists', {
        title: 'Мои списки глаголов',
        user: req.user,
        userStyles: true
    });
});

// GET /user/lists/:id - Отображение детальной страницы списка
router.get('/lists/:id', authenticateJWT, (req, res) => {
    res.render('user/listDetail', {
        title: 'Список глаголов',
        user: req.user,
        listId: req.params.id,
        userStyles: true
    });
});

export default router; 