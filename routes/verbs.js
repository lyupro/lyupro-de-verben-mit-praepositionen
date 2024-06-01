// routes/verbs.js
const express = require('express');
const router = express.Router();
const verbRoutes = require('./verbRoutes');

router.use('/', verbRoutes);

module.exports = router;