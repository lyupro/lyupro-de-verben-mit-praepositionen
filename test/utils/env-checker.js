// test/utils/env-checker.js
// Скрипт для проверки конфигурации переменных окружения (тестовая утилита)

import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../db.js';

/**
 * Проверяет критические переменные окружения
 */
function checkEnvironmentVariables() {
    console.log('\n🔍 Проверка переменных окружения...\n');
    
    const criticalVars = [
        { name: 'JWT_SECRET', value: process.env.JWT_SECRET, critical: true },
        { name: 'JWT_EXPIRES_IN', value: process.env.JWT_EXPIRES_IN, critical: true },
        { name: 'MONGO_URI', value: process.env.MONGO_URI, critical: true },
        { name: 'NODE_ENV', value: process.env.NODE_ENV, critical: false },
        { name: 'NODE_PORT', value: process.env.NODE_PORT, critical: false },
        { name: 'APP_NAME', value: process.env.APP_NAME, critical: false },
        { name: 'APP_ENV', value: process.env.APP_ENV, critical: false }
    ];

    let hasErrors = false;

    criticalVars.forEach(({ name, value, critical }) => {
        if (value) {
            console.log(`✅ ${name}: ЗАГРУЖЕНА`);
        } else {
            const status = critical ? '❌ КРИТИЧНО' : '⚠️  ОТСУТСТВУЕТ';
            console.log(`${status} ${name}: НЕ НАЙДЕНА`);
            if (critical) hasErrors = true;
        }
    });

    return !hasErrors;
}

/**
 * Тестирует JWT функциональность
 */
function testJWTFunctionality() {
    console.log('\n🔐 Тестирование JWT...\n');
    
    try {
        // Создание токена
        const testPayload = { 
            test: 'data', 
            timestamp: Date.now() 
        };
        
        const testToken = jwt.sign(
            testPayload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );
        
        console.log('✅ JWT подпись: УСПЕШНО');
        console.log(`📏 Длина токена: ${testToken.length} символов`);
        
        // Верификация токена
        const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
        console.log('✅ JWT верификация: УСПЕШНО');
        console.log(`📋 Payload содержит: ${Object.keys(decoded).join(', ')}`);
        
        return true;
    } catch (error) {
        console.log('❌ JWT тест: ОШИБКА');
        console.log(`🚨 Ошибка: ${error.message}`);
        return false;
    }
}

/**
 * Тестирует подключение к базе данных
 */
async function testDatabaseConnection() {
    console.log('\n🗄️  Тестирование базы данных...\n');
    
    try {
        await connectToDatabase();
        console.log('✅ MongoDB подключение: УСПЕШНО');
        console.log(`🌐 URI: ${process.env.MONGO_URI || process.env.MONGODB_URI}`);
        return true;
    } catch (error) {
        console.log('❌ MongoDB подключение: ОШИБКА');
        console.log(`🚨 Ошибка: ${error.message}`);
        return false;
    }
}

/**
 * Основная функция проверки
 */
async function runHealthCheck() {
    console.log('🩺 Диагностика системы Deutsch Trainer\n');
    console.log('=' .repeat(50));
    
    const envCheck = checkEnvironmentVariables();
    const jwtCheck = testJWTFunctionality();
    const dbCheck = await testDatabaseConnection();
    
    console.log('\n' + '=' .repeat(50));
    console.log('\n📊 ИТОГОВЫЙ РЕЗУЛЬТАТ:');
    
    if (envCheck && jwtCheck && dbCheck) {
        console.log('🎉 Все системы готовы к работе!');
        process.exit(0);
    } else {
        console.log('⚠️  Обнаружены проблемы в конфигурации!');
        console.log('\n🔧 РЕКОМЕНДАЦИИ:');
        
        if (!envCheck) {
            console.log('• Проверьте файл .env и добавьте отсутствующие переменные');
        }
        if (!jwtCheck) {
            console.log('• Убедитесь что JWT_SECRET установлен правильно');
        }
        if (!dbCheck) {
            console.log('• Проверьте что MongoDB запущен и доступен');
        }
        
        process.exit(1);
    }
}

// Запуск проверки
runHealthCheck().catch(error => {
    console.error('🚨 Критическая ошибка при запуске диагностики:', error);
    process.exit(1);
}); 