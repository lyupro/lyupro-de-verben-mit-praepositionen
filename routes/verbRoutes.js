// routes/verbRoutes.js
const express = require('express');
const router = express.Router();
const createController = require('./verbs/create');
const readController = require('./verbs/read');
const updateController = require('./verbs/update');
const deleteController = require('./verbs/delete');

// Маршруты для создания глаголов
router.get('/create', createController.showCreateForm);
router.post('/', createController.createVerb);

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
router.put('/:letter/:verb', updateController.updateVerb);

// Маршруты для удаления глаголов
//router.delete('/:letter/:verb', deleteController.deleteVerb);

module.exports = router;