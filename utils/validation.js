// utils/validation.js
import { body, validationResult } from 'express-validator';

export const userValidationRules = () => {
    return [
        body('username')
            .trim()
            .not().isEmpty().withMessage('Username is required')
            .isLength({ min: 4, max: 15 }).withMessage('Username must be between 4 and 15 characters')
            .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
        body('email')
            .trim()
            .isEmail().withMessage('Valid email is required')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    ];
};

export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};