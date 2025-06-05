import express from 'express';

const router = express.Router();

// GET /auth/login - Отображение формы входа
router.get('/login', (req, res) => {
    res.render('auth/login', {
        title: 'Вход в систему',
        authStyles: true
    });
});

// GET /auth/register - Отображение формы регистрации
router.get('/register', (req, res) => {
    res.render('auth/register', {
        title: 'Регистрация',
        authStyles: true
    });
});

export default router; 