// utils/logger.js
// Система логирования для продакшена

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создаем директорию для логов если её нет
const logDirectory = process.env.LOG_DIRECTORY || path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

/**
 * Форматтер для читаемых логов
 */
const customFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        // Добавляем метаданные если есть
        if (Object.keys(meta).length > 0) {
            log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        
        // Добавляем stack trace для ошибок
        if (stack) {
            log += `\n${stack}`;
        }
        
        return log;
    })
);

/**
 * Конфигурация транспортов для разных уровней логирования
 */
const transports = [
    // Консольный вывод
    new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: winston.format.combine(
            winston.format.colorize(),
            customFormat
        )
    })
];

// В продакшене добавляем файловые транспорты
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
    // Общий лог файл
    transports.push(
        new winston.transports.File({
            filename: path.join(logDirectory, 'app.log'),
            level: 'info',
            format: customFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        })
    );

    // Отдельный файл для ошибок
    transports.push(
        new winston.transports.File({
            filename: path.join(logDirectory, 'error.log'),
            level: 'error',
            format: customFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        })
    );

    // Файл для безопасности
    transports.push(
        new winston.transports.File({
            filename: path.join(logDirectory, 'security.log'),
            level: 'warn',
            format: customFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 10,
            tailable: true
        })
    );
}

/**
 * Основной логгер
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports,
    // Предотвращаем падение процесса при ошибке логирования
    exitOnError: false
});

/**
 * Специализированные логгеры
 */
export const securityLogger = winston.createLogger({
    level: 'warn',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        ...(process.env.NODE_ENV === 'production' ? [
            new winston.transports.File({
                filename: path.join(logDirectory, 'security.log'),
                format: customFormat
            })
        ] : [])
    ]
});

export const authLogger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        ...(process.env.NODE_ENV === 'production' ? [
            new winston.transports.File({
                filename: path.join(logDirectory, 'auth.log'),
                format: customFormat
            })
        ] : [])
    ]
});

/**
 * Middleware для логирования HTTP запросов
 */
export function httpLogger() {
    return (req, res, next) => {
        const start = Date.now();
        
        // Логируем начало запроса
        logger.info('HTTP Request Started', {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Перехватываем окончание ответа
        const originalSend = res.send;
        res.send = function(data) {
            const duration = Date.now() - start;
            
            // Логируем завершение запроса
            logger.info('HTTP Request Completed', {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip
            });

            return originalSend.call(this, data);
        };

        next();
    };
}

/**
 * Middleware для логирования ошибок
 */
export function errorLogger() {
    return (err, req, res, next) => {
        logger.error('Application Error', {
            error: err.message,
            stack: err.stack,
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        next(err);
    };
}

export default logger; 