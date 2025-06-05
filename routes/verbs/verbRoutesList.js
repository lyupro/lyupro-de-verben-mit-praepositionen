// routes/verbs/verbRoutesList.js
import express from 'express';
import { optionalAuthenticateJWT } from '../../middleware/optionalAuthJWT.js';
import * as readController from './read.js';
import alphabet from '../../config/alphabet.js';

const router = express.Router();

// Создаем регулярное выражение для всех возможных букв
const letterRegex = new RegExp(`^(${alphabet.getAll().join('|')})$`);
console.log('routes/verbs/verbRoutesList.js | letterRegex: ', letterRegex);

router.get('/', optionalAuthenticateJWT, readController.showVerbsWithPagination);
router.get('/search', optionalAuthenticateJWT, readController.searchVerbs);
router.get('/:page([0-9]+)', optionalAuthenticateJWT, readController.showVerbsWithPagination);
router.get('/:letter([a-z]+)/:page([0-9]+)', optionalAuthenticateJWT, readController.showVerbsByLetter);
router.get('/:letter([a-z]+)', optionalAuthenticateJWT, readController.showVerbsByLetter);

export default router;