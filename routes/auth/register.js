// routes/auth/register.js
import { hashPassword } from '../../utils/auth/hash.js';
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
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'User with this email or username already exists'
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();

        const sanitizedUser = sanitizeUser(newUser);
        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            user: sanitizedUser
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                status: 'error',
                message: 'User with this email or username already exists'
            });
        }
        next(error);
    }
};