// routes/admin.js
import express from 'express';
import { checkRole } from '../../middleware/checkRole.js';
import User from '../../models/user.js';
import { getVerbModel } from '../../models/verb.js';
import alphabetConfig from '../../config/alphabet.js';

const router = express.Router();

// Получение списка пользователей (только для администраторов)
router.get('/users', checkRole(['administrator']), async (req, res, next) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (error) {
        next(error);
    }
});

// Изменение роли пользователя (только для администраторов)
router.put('/users/:userId/role', checkRole(['administrator']), async (req, res, next) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(req.params.userId, { role }, { new: true, select: '-password' });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        next(error);
    }
});

// Удаление пользователя (только для администраторов)
router.delete('/users/:userId', checkRole(['administrator']), async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// Получение списка непроверенных глаголов (для модераторов и администраторов)
router.get('/verbs/unverified', checkRole(['moderator', 'administrator']), async (req, res, next) => {
    try {
        const unverifiedVerbs = [];
        for (const letter of alphabetConfig.getAll()) {
            const VerbModel = getVerbModel(letter);
            const verbs = await VerbModel.find({ verified: false });
            unverifiedVerbs.push(...verbs);
        }
        res.json(unverifiedVerbs);
    } catch (error) {
        next(error);
    }
});

// Подтверждение глагола (для модераторов и администраторов)
router.put('/verbs/:verbId/verify', checkRole(['moderator', 'administrator']), async (req, res, next) => {
    try {
        const { letter } = req.body;
        const VerbModel = getVerbModel(letter);
        const verb = await VerbModel.findByIdAndUpdate(req.params.verbId, { verified: true }, { new: true });
        if (!verb) {
            return res.status(404).json({ message: 'Verb not found' });
        }
        res.json(verb);
    } catch (error) {
        next(error);
    }
});

export default router;