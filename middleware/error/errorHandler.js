// middleware/error/errorHandler.js

export const errorHandler = (err, req, res, next) => {
    console.error('Error handler caught:', err.message);
    console.error('Error stack:', err.stack);

    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Проверяем, ожидает ли запрос HTML или JSON ответ
    const isApiRequest = req.xhr || 
                        req.path.startsWith('/api/') || 
                        req.path.startsWith('/user/favorites') ||
                        req.path.startsWith('/user/lists') ||
                        req.get('Accept')?.includes('application/json') ||
                        req.get('Content-Type')?.includes('application/json');

    if (isApiRequest) {
        // Для API запросов отправляем JSON
        return res.status(statusCode).json({
            status: 'error',
            statusCode,
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    } else {
        // Для обычных запросов рендерим страницу ошибки
        try {
            res.status(statusCode).render('error', {
                title: `Ошибка ${statusCode}`,
                statusCode,
                message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : null
            });
        } catch (renderError) {
            console.error('Error rendering error page:', renderError);
            // Fallback для случаев когда рендеринг не удается
            res.status(statusCode).send(`
                <html>
                    <body>
                        <h1>Ошибка ${statusCode}</h1>
                        <p>${message}</p>
                    </body>
                </html>
            `);
        }
    }
};