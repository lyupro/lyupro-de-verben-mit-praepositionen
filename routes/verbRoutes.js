// routes/verbRoutes.js
import express from 'express';
import * as createController from './verbs/create.js';
import * as readController from './verbs/read.js';
import * as updateController from './verbs/update.js';
import * as deleteController from './verbs/delete.js';

const router = express.Router();

// Маршруты для создания глаголов
router.get('/create', createController.showCreateForm);
router.post('/', createController.createVerbHandler);

// Маршруты для чтения глаголов
router.get('/', readController.showVerbsWithPagination);
router.get('/search', readController.searchVerbs);
router.get('/:page', readController.showVerbsWithPagination);
router.get('/:letter([a-z])/:page([0-9]+)', readController.showVerbsByLetter);
router.get('/:letter([a-z])', readController.showVerbsByLetter);
router.get('/:letter([a-z])/:verb', readController.showVerb);
router.get('/:letter([a-z])/:verb/learn/visually', readController.getVerbDataForVisualLearning);

// Маршруты для обновления глаголов
router.get('/:letter/:verb/edit', updateController.showEditForm);
router.put('/:letter/:verb', updateController.updateVerbHandler);

// Маршруты для удаления глаголов
router.delete('/:letter/:verb', deleteController.deleteVerbHandler);

export default router;