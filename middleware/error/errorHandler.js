// middleware/error/errorHandler.js

export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';

    // Проверяем, ожидает ли запрос HTML или JSON ответ
    const isApiRequest = req.xhr || req.path.startsWith('/api/');

    if (isApiRequest) {
        // Для API запросов отправляем JSON
        res.status(statusCode).json({
            status: 'error',
            statusCode,
            message,
            ...(process.env.APP_ENV === 'development' && process.env.APP_DEBUG === 'true' && { stack: err.stack })
        });
    } else {
        // Для обычных запросов рендерим страницу ошибки
        res.status(statusCode).render('error', {
            title: 'Ошибка',
            statusCode,
            message,
            stack: process.env.APP_ENV === 'development' && process.env.APP_DEBUG === 'true' ? err.stack : null
        });
    }
};