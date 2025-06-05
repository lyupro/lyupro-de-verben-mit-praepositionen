// routes/auth/register.js
import { validateUser, sanitizeUser } from '../../utils/auth/validation.js';
import User from '../../models/user.js';

// POST /register - Создание нового пользователя
export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Validate user input
        const validationErrors = validateUser({ username, email, password });
        if (validationErrors.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Ошибка валидации',
                errors: validationErrors
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'Пользователь с таким email или именем уже существует'
            });
        }

        // Create new user (password will be hashed automatically by User model middleware)
        const newUser = new User({
            username,
            email,
            password // Не хешируем пароль вручную - это делает middleware модели
        });

        await newUser.save();

        const sanitizedUser = sanitizeUser(newUser);
        res.status(201).json({
            status: 'success',
            message: 'Пользователь успешно зарегистрирован',
            user: sanitizedUser
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                status: 'error',
                message: 'Пользователь с таким email или именем уже существует'
            });
        }
        next(error);
    }
};