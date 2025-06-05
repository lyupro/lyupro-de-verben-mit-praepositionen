const express = require('express');
const router = express.Router();
const { userValidationRules, validate } = require('../utils/validation');
const { hashPassword } = require('../utils/auth/hash.js');
const User = require('../models/User');

router.post('/', userValidationRules(), validate, async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await hashPassword(password);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.redirect('/');
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
            error.status = 400;
            error.message = 'User with this email or username already exists';
        }
        next(error);
    }
});

module.exports = router;
