const express = require('express');
const router = express.Router();
const createRouter = require('./verbs/create');
const readRouter = require('./verbs/read');
const updateRouter = require('./verbs/update');
const deleteRouter = require('./verbs/delete');

router.use('/', createRouter);
router.use('/', readRouter);
router.use('/', updateRouter);
router.use('/', deleteRouter);

module.exports = router;