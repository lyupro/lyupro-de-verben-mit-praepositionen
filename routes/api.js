// routes/api.js
import express from 'express';
import namedRoutesRouter from './api/namedRoutes.js';

const router = express.Router();

// Маршруты для именованных маршрутов
router.use('/named-routes', namedRoutesRouter);

export default router;