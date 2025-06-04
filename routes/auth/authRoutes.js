// routes/auth/authRoutes.js
import express from 'express';
import { login } from './login.js';
import { register } from './register.js';
import authViewRoutes from './authViewRoutes.js';

const router = express.Router();

// API роуты
router.post('/login', login);
router.post('/register', register);

// View роуты
router.use('/', authViewRoutes);

export default router;