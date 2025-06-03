// routes/verbs/verbRoutesDetail.js
import express from 'express';
import { checkRole } from '../../middleware/checkRole.js';
import { authenticateJWT, optionalAuthenticateJWT } from '../../middleware/auth/authenticateJWT.js';
import * as createController from './create.js';
import * as readController from './read.js';
import * as updateController from './update.js';
import * as deleteController from './delete.js';

const router = express.Router();

// Публичные маршруты для чтения глаголов (доступно всем пользователям)
// Исключаем цифры из паттерна глаголов, чтобы не конфликтовать с пагинацией
router.get('/:letter([a-z])/:verb([a-zA-Z]+)', optionalAuthenticateJWT, readController.showVerb);
router.get('/:letter([a-z])/:verb([a-zA-Z]+)/learn/visually', optionalAuthenticateJWT, readController.getVerbDataForVisualLearning);

// Маршруты для создания глаголов (требуют аутентификации и роли)
router.post('/', authenticateJWT, checkRole(['helper', 'moderator', 'administrator']), createController.createVerbHandler);
router.get('/create', authenticateJWT, checkRole(['helper', 'moderator', 'administrator']), createController.showCreateForm);

// Маршруты для обновления глаголов (требуют аутентификации и роли)
router.get('/:letter/:verb/edit', authenticateJWT, checkRole(['moderator', 'administrator']), updateController.showEditForm);
router.put('/:letter/:verb', authenticateJWT, checkRole(['moderator', 'administrator']), updateController.updateVerbHandler);
// Маршрут для верификации глаголов (для moderator, administrator)
//router.post('/:letter/:verb/verify', authenticateJWT, checkRole(['moderator', 'administrator']), updateController.verifyVerbHandler);
//router.get('/:letter([a-z])/:verb/:userId', optionalAuthenticateJWT, readController.getUserVerbs);

// Маршрут для удаления глаголов (требует аутентификации и роли)
router.delete('/:letter/:verb', authenticateJWT, checkRole(['administrator']), deleteController.deleteVerbHandler);

export default router;