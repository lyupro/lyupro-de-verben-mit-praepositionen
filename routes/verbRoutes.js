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
router.get('/:letter/:verb/learn/visually', readController.getVerbDataForVisualLearning);
router.get('/:letter/:verb', readController.showVerb);
router.get('/:letter([a-z])/:page?', (req, res, next) => {
    const { letter, page } = req.params;
    console.log("ROUTE /:letter/:page? | req.params: ", req.params);
    if (page === undefined) {
        return readController.showVerbsByLetter(req, res, next);
    } else {
        next();
    }
}, readController.showVerbsByLetter);
router.get('/:page', readController.showVerbsWithPagination);

// Маршруты для обновления глаголов
router.get('/:letter/:verb/edit', updateController.showEditForm);
router.put('/:letter/:verb', updateController.updateVerb);

// Маршруты для удаления глаголов
//router.delete('/:letter/:verb', deleteController.deleteVerb);

module.exports = router;