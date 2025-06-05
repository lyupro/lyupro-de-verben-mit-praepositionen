// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../../models/user.js';

export const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Токен не предоставлен'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Проверяем существование пользователя в базе данных
        const user = await User.findById(decoded.id || decoded.userId);
        
        if (!user) {
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
        return res.status(401).json({
            message: 'Недействительный токен'
        });
    }
};