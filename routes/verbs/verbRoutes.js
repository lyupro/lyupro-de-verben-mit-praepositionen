// routes/verbs.js
import express from 'express';
import verbRoutesDetail from './verbRoutesDetail.js';
import verbRoutesList from './verbRoutesList.js';

const router = express.Router();

router.use('/', verbRoutesList);  // Для маршрутов списка глаголов (более специфичные)
router.use('/', verbRoutesDetail);  // Для маршрутов отдельных глаголов (общие)

export default router;