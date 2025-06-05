import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const optionalAuthenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Проверяем существование пользователя в базе данных
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
            // Игнорируем ошибки JWT в optional middleware
        }
    }

    next();
};
