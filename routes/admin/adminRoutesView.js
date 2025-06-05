import express from 'express';
import { checkRole } from '../../middleware/checkRole.js';
import User from '../../models/user.js';
import { getVerbModel } from '../../models/verb.js';
import alphabetConfig from '../../config/alphabet.js';

const router = express.Router();

// Главная страница админ-панели
router.get('/', checkRole(['moderator', 'administrator']), async (req, res) => {
    try {
        // Счетчики для статистики
        const usersCount = await User.countDocuments();
        
        let verbsCount = 0;
        let unverifiedCount = 0;
        
        for (const letter of alphabetConfig.getAll()) {
            const VerbModel = getVerbModel(letter);
            verbsCount += await VerbModel.countDocuments();
            unverifiedCount += await VerbModel.countDocuments({ verified: false });
        }
        
        res.render('admin/dashboard', {
            title: 'Админ-панель',
            user: req.user,
            adminStyles: true, // Флаг для подключения стилей админ-панели
            stats: {
                usersCount,
                verbsCount,
                unverifiedCount
            }
        });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки панели администратора' });
    }
});

// Управление пользователями
router.get('/users', checkRole(['administrator']), async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.render('admin/users', {
            title: 'Управление пользователями',
            user: req.user,
            adminStyles: true, // Флаг для подключения стилей админ-панели
            users
        });
    } catch (error) {
        console.error('Error loading users management:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки списка пользователей' });
    }
});

// Управление глаголами
router.get('/verbs', checkRole(['moderator', 'administrator']), async (req, res) => {
    try {
        const unverifiedVerbs = [];
        for (const letter of alphabetConfig.getAll()) {
            const VerbModel = getVerbModel(letter);
            const verbs = await VerbModel.find({ verified: false });
            unverifiedVerbs.push(...verbs.map(verb => ({
                ...verb.toObject(),
                letter
            })));
        }
        
        res.render('admin/verbs', {
            title: 'Управление глаголами',
            user: req.user,
            adminStyles: true, // Флаг для подключения стилей админ-панели
            verbs: unverifiedVerbs
        });
    } catch (error) {
        console.error('Error loading verbs management:', error);
        res.status(500).render('error', { message: 'Ошибка загрузки списка глаголов' });
    }
});

export default router;
