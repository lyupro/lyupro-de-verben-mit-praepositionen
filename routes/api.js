// routes/api.js
const express = require('express');
const router = express.Router();
const namedRoutesRouter = require('./api/namedRoutes');

// Маршруты для именованных маршрутов
router.use('/named-routes', namedRoutesRouter);

module.exports = router;