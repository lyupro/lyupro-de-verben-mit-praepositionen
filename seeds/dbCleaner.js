import readline from 'readline';
import { connectToDatabase, disconnectFromDatabase, getDatabaseStats, formatStats } from '../utils/dbSeederUtils.js';
import importConfig from '../config/importConfig.js';
import { getVerbModel, getVerbTranslationModel, getVerbTensesModel, getVerbSentencesModel, getVerbSentencesTranslationModel } from '../models/verb.js';
import { fileURLToPath } from 'url';

/**
 * Очистка всех коллекций глаголов в MongoDB
 * ВНИМАНИЕ: НЕ ТРОГАЕТ файлы в !db
 */
async function cleanDatabase() {
    console.log('🧹 Очистка базы данных глаголов');
    console.log('⚠️  ВНИМАНИЕ: Эта операция удалит ВСЕ коллекции глаголов из MongoDB!');
    console.log('📁 Файлы в папке !db НЕ БУДУТ затронуты.\n');
    
    try {
        // Подключаемся к базе данных
        await connectToDatabase();
        
        // Получаем статистику до очистки
        console.log('📊 Получение текущей статистики...');
        const statsBefore = await getDatabaseStats();
        console.log(formatStats(statsBefore));
        
        // Подтверждение пользователя
        const confirmed = await askForConfirmation();
        if (!confirmed) {
            console.log('❌ Операция отменена пользователем');
            return;
        }
        
        console.log('\n🗑️  Начинаю очистку коллекций...');
        const cleanupStats = await performCleanup();
        
        // Получаем статистику после очистки
        console.log('\n📊 Получение статистики после очистки...');
        const statsAfter = await getDatabaseStats();
        console.log(formatStats(statsAfter));
        
        // Итоговый отчет
        console.log('✅ Очистка завершена!');
        console.log(`   Удалено коллекций: ${cleanupStats.deletedCollections}`);
        console.log(`   Удалено записей: ${cleanupStats.deletedDocuments}`);
        console.log(`   Ошибок: ${cleanupStats.errors}`);
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
        process.exit(1);
    } finally {
        await disconnectFromDatabase();
    }
}

/**
 * Выполняет актуальную очистку коллекций
 */
async function performCleanup() {
    const stats = {
        deletedCollections: 0,
        deletedDocuments: 0,
        errors: 0
    };
    
    for (const letter of importConfig.supportedLetters) {
        console.log(`   📖 Очистка данных для буквы: ${letter.toUpperCase()}`);
        
        try {
            // Очищаем основные глаголы
            const verbModel = getVerbModel(letter);
            const verbCount = await verbModel.countDocuments();
            if (verbCount > 0) {
                await verbModel.deleteMany({});
                stats.deletedDocuments += verbCount;
                stats.deletedCollections++;
                console.log(`      ✅ Глаголы: удалено ${verbCount} записей`);
            }
            
            // Очищаем переводы
            for (const language of importConfig.supportedLanguages) {
                try {
                    const translationModel = getVerbTranslationModel(letter, language);
                    const translationCount = await translationModel.countDocuments();
                    if (translationCount > 0) {
                        await translationModel.deleteMany({});
                        stats.deletedDocuments += translationCount;
                        stats.deletedCollections++;
                        console.log(`      ✅ Переводы (${language}): удалено ${translationCount} записей`);
                    }
                } catch (error) {
                    // Коллекция может не существовать
                }
            }
            
            // Очищаем времена и предложения
            for (const tense of importConfig.supportedTenses) {
                try {
                    // Времена
                    const tenseModel = getVerbTensesModel(letter, tense);
                    const tenseCount = await tenseModel.countDocuments();
                    if (tenseCount > 0) {
                        await tenseModel.deleteMany({});
                        stats.deletedDocuments += tenseCount;
                        stats.deletedCollections++;
                        console.log(`      ✅ Времена (${tense}): удалено ${tenseCount} записей`);
                    }
                    
                    // Предложения
                    const sentenceModel = getVerbSentencesModel(letter, tense);
                    const sentenceCount = await sentenceModel.countDocuments();
                    if (sentenceCount > 0) {
                        await sentenceModel.deleteMany({});
                        stats.deletedDocuments += sentenceCount;
                        stats.deletedCollections++;
                        console.log(`      ✅ Предложения (${tense}): удалено ${sentenceCount} записей`);
                    }
                    
                    // Переводы предложений
                    for (const language of importConfig.supportedLanguages) {
                        try {
                            const sentenceTranslationModel = getVerbSentencesTranslationModel(letter, tense, language);
                            const sentenceTranslationCount = await sentenceTranslationModel.countDocuments();
                            if (sentenceTranslationCount > 0) {
                                await sentenceTranslationModel.deleteMany({});
                                stats.deletedDocuments += sentenceTranslationCount;
                                stats.deletedCollections++;
                                console.log(`      ✅ Переводы предложений (${tense}, ${language}): удалено ${sentenceTranslationCount} записей`);
                            }
                        } catch (error) {
                            // Коллекция может не существовать
                        }
                    }
                } catch (error) {
                    // Коллекция может не существовать
                }
            }
            
        } catch (error) {
            console.error(`      ❌ Ошибка при очистке буквы ${letter}:`, error.message);
            stats.errors++;
        }
    }
    
    return stats;
}

/**
 * Запрашивает подтверждение пользователя
 */
async function askForConfirmation() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question('Вы уверены, что хотите удалить ВСЕ данные? Введите "yes" для подтверждения: ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes');
        });
    });
}

/**
 * Проверка аргументов командной строки
 */
function parseCommandLineArgs() {
    const args = process.argv.slice(2);
    const options = {
        force: false, // Пропустить подтверждение
        backup: false // Создать бэкап перед очисткой
    };
    
    args.forEach(arg => {
        switch (arg) {
            case '--force':
                options.force = true;
                break;
            case '--backup':
                options.backup = true;
                break;
            case '--help':
                showHelp();
                process.exit(0);
                break;
        }
    });
    
    return options;
}

/**
 * Показать справку
 */
function showHelp() {
    console.log(`
Очистка базы данных глаголов

Использование:
  npm run clean:db [опции]

Опции:
  --force       Пропустить подтверждение (ОПАСНО!)
  --backup      Создать бэкап перед очисткой (пока не реализовано)
  --help        Показать эту справку

Примеры:
  npm run clean:db
  npm run clean:db -- --force

ВНИМАНИЕ:
  Эта команда удаляет ВСЕ данные глаголов из MongoDB!
  Файлы в папке !db НЕ затрагиваются.
  
  После очистки используйте "npm run import:full" для восстановления данных.
    `);
}

/**
 * Основная функция с поддержкой --force
 */
async function cleanDatabaseWithOptions() {
    const options = parseCommandLineArgs();
    
    if (options.force) {
        console.log('🧹 Очистка базы данных глаголов (режим --force)');
        console.log('⚠️  Пропускаю подтверждение пользователя...\n');
        
        try {
            await connectToDatabase();
            console.log('🗑️  Начинаю очистку коллекций...');
            const cleanupStats = await performCleanup();
            
            console.log('\n✅ Очистка завершена!');
            console.log(`   Удалено коллекций: ${cleanupStats.deletedCollections}`);
            console.log(`   Удалено записей: ${cleanupStats.deletedDocuments}`);
            console.log(`   Ошибок: ${cleanupStats.errors}`);
        } catch (error) {
            console.error('❌ Критическая ошибка:', error.message);
            process.exit(1);
        } finally {
            await disconnectFromDatabase();
        }
    } else {
        await cleanDatabase();
    }
}

// Запускаем очистку, если файл выполняется напрямую
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
    cleanDatabaseWithOptions().catch(error => {
        console.error('💥 Неожиданная ошибка:', error);
        process.exit(1);
    });
} 