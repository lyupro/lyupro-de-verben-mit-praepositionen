// test/setup/testServer.js
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Загружаем тестовые переменные окружения
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

import express from 'express';
import methodOverride from 'method-override';
import { connectToDatabase } from '../../db.js';
import { getNamedRoute } from '../../middleware/namedRoutes.js';
import { createModels } from '../../models/verb.js';
import apiRouter from '../../routes/api.js';
import verbRoute from '../../routes/verb.js';
import authRoutes from '../../routes/auth/authRoutes.js';
import verbRoutes from '../../routes/verbs/verbRoutes.js';
import adminRoutes from '../../routes/admin/adminRoutes.js';
import adminRoutesView from '../../routes/admin/adminRoutesView.js';
import userRoutes from '../../routes/user/userRoutes.js';
import { authenticateJWT } from '../../middleware/auth/authenticateJWT.js';
import { errorHandler } from '../../middleware/error/errorHandler.js';

// Создаем отдельный app для тестирования
export function createTestApp() {
    const app = express();

    // Настройка шаблонизатора EJS
    app.set('view engine', 'ejs');
    app.set('views', join(__dirname, '../../views'));

    // Обслуживание статических файлов
    app.use(express.static(join(__dirname, '../../public')));

    // Парсинг тела запроса
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    // Middleware для обработки методов PUT и DELETE
    app.use(methodOverride('_method'));

    app.locals.getNamedRoute = getNamedRoute;

    // Маршруты
    app.get('/', (req, res) => {
        res.json({ message: 'Test server is running' });
    });

    app.use('/verb', verbRoute);
    app.use('/api', apiRouter);
    app.use('/auth', authRoutes);
    app.use('/verbs', verbRoutes);
    app.use('/user', userRoutes);
    app.use('/admin', authenticateJWT, adminRoutes);
    app.use('/admin/view', authenticateJWT, adminRoutesView);

    // Обработка ошибок
    app.use(errorHandler);

    return app;
}

// Инициализация базы данных для тестов
export async function initTestDatabase() {
    await connectToDatabase();
    createModels();
}

// Экспортируем для использования в тестах
export { connectToDatabase }; 