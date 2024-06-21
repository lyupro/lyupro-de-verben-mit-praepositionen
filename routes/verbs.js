// routes/verbs.js
import express from 'express';
import verbRoutes from './verbRoutes.js';

const router = express.Router();

router.use('/', verbRoutes);

export default router;