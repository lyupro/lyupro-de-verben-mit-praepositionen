// routes/auth/login.js
import { sanitizeUser } from '../../utils/auth/validation.js';
import User from '../../models/user.js';
import jwt from 'jsonwebtoken';

// POST /login - Вход пользователя
export const login = async (req, res, next) => {
    try {
        // Проверяем наличие JWT_SECRET
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables');
            return res.status(500).json({
                status: 'error',
                message: 'Ошибка конфигурации сервера'
            });
        }

        const { email, password } = req.body;

        // Валидация входных данных
        const errors = [];
        if (!email) {
            errors.push('Email обязателен');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Email должен быть в правильном формате');
        }
        if (!password) {
            errors.push('Пароль обязателен');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                status: 'error',
                errors: errors
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Неверный email или пароль'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Неверный email или пароль'
            });
        }

        // Обновляем время последнего входа
        user.lastLogin = new Date();
        await user.save();

        // Создаем JWT токен
        const token = jwt.sign(
            { 
                id: user._id,
                userId: user._id, // для совместимости
                username: user.username,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Устанавливаем cookie с токеном для браузерных переходов
        const cookieOptions = {
            httpOnly: true, // Защищает от XSS
            secure: process.env.NODE_ENV === 'production', // HTTPS только в продакшене
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней в миллисекундах
            sameSite: 'lax' // Защищает от CSRF
        };

        res.cookie('auth_token', token, cookieOptions);

        res.status(200).json({
            status: 'success',
            message: 'Вход выполнен успешно',
            token,
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error('Login error:', error);
        next(error);
    }
};

// GET /login - Страница входа
export const loginPage = (req, res) => {
    // Если пользователь уже авторизован, перенаправляем на профиль
    if (req.user) {
        return res.redirect('/user/profile');
    }

    const redirectUrl = req.query.redirect || '/';
    
    res.render('auth/login', {
        title: 'Вход в систему',
        redirectUrl: redirectUrl,
        authStyles: true
    });
};