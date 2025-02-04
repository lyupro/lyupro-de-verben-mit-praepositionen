// routes/api/namedRoutes.js
import express from 'express';
import { getNamedRoute } from '../../middleware/namedRoutes.js';

const router = express.Router();

// GET /verbs/create - Передача в AJAX ссылку
router.get('/', (req, res) => {
    console.log('routes/api/namedRoutes.js | name: ', req.query.name);
    console.log('routes/api/namedRoutes.js | params: ', req.query.params);
    const name = req.query.name;
    const params = req.query.params ? JSON.parse(req.query.params) : {};


    try {
        const url = getNamedRoute(name, params);
        res.json({ url });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;