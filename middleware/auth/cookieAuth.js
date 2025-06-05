// middleware/auth/cookieAuth.js
// Cookie-based аутентификация для view роутов

import jwt from 'jsonwebtoken';
import User from '../../models/user.js';

/**
 * Middleware для аутентификации через cookies
 * Используется для view роутов где пользователь переходит через браузер
 */
export const authenticateCookie = async (req, res, next) => {
    let token = null;

    // Пытаемся получить токен из разных источников
    // 1. Authorization header (приоритет)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    
    // 2. Cookie
    if (!token && req.cookies && req.cookies.auth_token) {
        token = req.cookies.auth_token;
    }
    
    // 3. Query parameter (для особых случаев)
    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        // Для view роутов перенаправляем на страницу входа
        if (req.path.startsWith('/user/') && req.method === 'GET') {
            return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
        }
        
        // Для API возвращаем ошибку
        return res.status(401).json({
            message: 'Токен не предоставлен'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Проверяем существование пользователя в базе данных
        const user = await User.findById(decoded.id || decoded.userId);
        
        if (!user) {
            if (req.path.startsWith('/user/') && req.method === 'GET') {
                return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
            }
            
            return res.status(401).json({
                message: 'Пользователь не найден'
            });
        }

        // Добавляем информацию о пользователе в запрос
        req.user = {
            id: user._id,
            userId: user._id, // для совместимости
            username: user.username,
            email: user.email,
            role: user.role,
            ...decoded
        };
        
        next();
    } catch (err) {
        console.error('Cookie auth error:', err.message);
        
        if (req.path.startsWith('/user/') && req.method === 'GET') {
            return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
        }
        
        return res.status(401).json({
            message: 'Недействительный токен'
        });
    }
};

/**
 * Опциональная аутентификация через cookies
 * Не требует токен, но если он есть - проверяет и устанавливает пользователя
 */
export const optionalCookieAuth = async (req, res, next) => {
    let token = null;

    // Пытаемся получить токен из разных источников
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.auth_token) {
        token = req.cookies.auth_token;
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id || decoded.userId);
            
            if (user) {
                req.user = {
                    id: user._id,
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    ...decoded
                };
            }
        } catch (err) {
            // Игнорируем ошибки в опциональной аутентификации
            console.log('Optional cookie auth failed:', err.message);
        }
    }

    next();
}; 