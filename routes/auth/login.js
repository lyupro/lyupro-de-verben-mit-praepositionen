// routes/auth/login.js
import { comparePassword } from '../../utils/auth/hash.js';
import { sanitizeUser } from '../../utils/auth/validation.js';
import User from '../../models/user.js';
import jwt from 'jsonwebtoken';

// POST /login - Вход пользователя
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        user.lastLogin = Date.now();
        await user.save();

        const sanitizedUser = sanitizeUser(user);
        res.json({
            status: 'success',
            message: 'Login successful',
            token,
            user: sanitizedUser
        });
    } catch (error) {
        next(error);
    }
};