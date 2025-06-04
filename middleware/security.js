// middleware/security.js
// Продакшн безопасность middleware

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';

/**
 * Базовые настройки безопасности Helmet
 */
export function configureHelmet() {
    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ['\'self\''],
                styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
                fontSrc: ['\'self\'', 'https://fonts.gstatic.com'],
                scriptSrc: ['\'self\''],
                imgSrc: ['\'self\'', 'data:', 'https:'],
                connectSrc: ['\'self\''],
                frameSrc: ['\'none\''],
                objectSrc: ['\'none\''],
                upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
            },
        },
        crossOriginEmbedderPolicy: false, // Отключаем для совместимости с EJS
    });
}

/**
 * Rate limiting для API endpoints
 */
export function configureRateLimit() {
    return rateLimit({
        windowMs: 15 * 60 * 1000, // 15 минут
        max: 100, // максимум 100 запросов за окно
        message: {
            error: 'Слишком много запросов с этого IP. Попробуйте позже.',
            retryAfter: 15 * 60 // секунды
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            // Пропускаем rate limiting для статических файлов
            return req.path.startsWith('/public') || 
                   req.path.startsWith('/css') || 
                   req.path.startsWith('/js') || 
                   req.path.startsWith('/images');
        }
    });
}

/**
 * Строгий rate limiting для аутентификации
 */
export function configureAuthRateLimit() {
    return rateLimit({
        windowMs: 15 * 60 * 1000, // 15 минут
        max: 5, // максимум 5 попыток входа за окно
        message: {
            error: 'Слишком много попыток входа. Попробуйте через 15 минут.',
            retryAfter: 15 * 60
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true, // Сбрасываем счетчик при успешном входе
    });
}

/**
 * GZIP сжатие для production
 */
export function configureCompression() {
    return compression({
        level: 6, // Уровень сжатия (1-9)
        threshold: 1024, // Сжимать файлы больше 1KB
        filter: (req, res) => {
            // Не сжимать если клиент не поддерживает
            if (req.headers['x-no-compression']) {
                return false;
            }
            // Использовать стандартный фильтр
            return compression.filter(req, res);
        }
    });
}

/**
 * Middleware для логирования безопасности
 */
export function securityLogger() {
    return (req, res, next) => {
        // Логируем подозрительные запросы
        const suspiciousPatterns = [
            /\.\./,  // Path traversal
            /<script/i,  // XSS attempt
            /union.*select/i,  // SQL injection
            /javascript:/i,  // JavaScript protocol
        ];

        const isSuspicious = suspiciousPatterns.some(pattern => 
            pattern.test(req.url) || 
            pattern.test(req.body ? JSON.stringify(req.body) : '') ||
            pattern.test(req.query ? JSON.stringify(req.query) : '')
        );

        if (isSuspicious) {
            console.warn('🚨 Подозрительный запрос:', {
                ip: req.ip,
                url: req.url,
                method: req.method,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });
        }

        next();
    };
}

/**
 * Middleware для скрытия информации о сервере
 */
export function hideServerInfo() {
    return (req, res, next) => {
        res.removeHeader('X-Powered-By');
        res.setHeader('Server', 'Deutsch-Trainer');
        next();
    };
} 