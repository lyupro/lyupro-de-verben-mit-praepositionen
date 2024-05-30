// routes/verbRoutes.js
const express = require('express');
const router = express.Router();
const createController = require('./verbs/create');
const readController = require('./verbs/read');
const updateController = require('./verbs/update');
const deleteController = require('./verbs/delete');
const { addNamedRoute } = require('../middleware/namedRoutes');

// Маршруты для создания глаголов
router.get('/create', addNamedRoute, createController.showCreateForm).namedRoute = 'verbs.create';
router.post('/', createController.createVerb).namedRoute = 'verbs.store';

// Маршруты для чтения глаголов
router.get('/', addNamedRoute, readController.showVerbsWithPagination).namedRoute = 'verbs.index';
router.get('/search', addNamedRoute, readController.searchVerbs).namedRoute = 'verbs.search';
router.get('/:letter/:verb/learn/visually', addNamedRoute, readController.getVerbDataForVisualLearning).namedRoute = 'verbs.learn.visually';
router.get('/:letter/:verb', addNamedRoute, readController.showVerb).namedRoute = 'verbs.show';
router.get('/:letter/:page?', addNamedRoute, readController.showVerbsByLetter).namedRoute = 'verbs.letter';
router.get('/:page', addNamedRoute, readController.showVerbsWithPagination).namedRoute = 'verbs.page';

// Маршруты для обновления глаголов
router.get('/:letter/:verb/edit', addNamedRoute, updateController.showEditForm).namedRoute = 'verbs.edit';
router.put('/:letter/:verb', updateController.updateVerb).namedRoute = 'verbs.update';

// Маршруты для удаления глаголов
//router.delete('/:letter/:verb', deleteController.deleteVerb).namedRoute = 'verbs.destroy';

module.exports = router;