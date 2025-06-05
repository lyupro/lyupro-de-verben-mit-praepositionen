import { connectToDatabase, disconnectFromDatabase, scanFilesForLetter, importDataOfType, getDatabaseStats, formatStats } from '../utils/dbSeederUtils.js';
import importConfig from '../config/importConfig.js';
import { fileURLToPath } from 'url';

/**
 * Полный импорт всех данных из папки !db
 */
async function fullDatabaseImport() {
    const startTime = Date.now();
    console.log('🚀 Запуск полного импорта базы данных...\n');
    
    let totalStats = {
        processedLetters: 0,
        processedFiles: 0,
        importedRecords: 0,
        errors: 0,
        skippedFiles: 0
    };
    
    try {
        // Подключаемся к базе данных
        await connectToDatabase();
        
        console.log('📁 Сканирование папки данных...');
        console.log(`   Путь: ${importConfig.paths.dataSource}`);
        console.log(`   Поддерживаемые буквы: ${importConfig.supportedLetters.length}`);
        console.log(`   Поддерживаемые времена: ${importConfig.supportedTenses.join(', ')}`);
        console.log(`   Поддерживаемые языки: ${importConfig.supportedLanguages.join(', ')}\n`);
        
        // Импортируем данные для каждой буквы
        for (const letter of importConfig.supportedLetters) {
            console.log(`📖 Обработка буквы: ${letter.toUpperCase()}`);
            
            try {
                const filesForLetter = scanFilesForLetter(letter);
                const letterStats = await importLetterData(letter, filesForLetter);
                
                // Обновляем общую статистику
                totalStats.processedLetters++;
                totalStats.processedFiles += letterStats.processedFiles;
                totalStats.importedRecords += letterStats.importedRecords;
                totalStats.errors += letterStats.errors;
                totalStats.skippedFiles += letterStats.skippedFiles;
                
                // Выводим статистику по букве
                const total = letterStats.processedFiles;
                const success = total - letterStats.errors - letterStats.skippedFiles;
                console.log(`   📊 Файлов: ${total}, импортировано: ${success}, ошибок: ${letterStats.errors}, пропущено: ${letterStats.skippedFiles}`);
                console.log(`   📈 Записей импортировано: ${letterStats.importedRecords}\n`);
                
            } catch (error) {
                console.error(`   ❌ Ошибка при обработке буквы ${letter}:`, error.message);
                totalStats.errors++;
            }
        }
        
        // Финальная статистика
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log('🎉 Импорт завершен!\n');
        console.log('📊 Итоговая статистика:');
        console.log(`   Обработано букв: ${totalStats.processedLetters}/${importConfig.supportedLetters.length}`);
        console.log(`   Обработано файлов: ${totalStats.processedFiles}`);
        console.log(`   Импортировано записей: ${totalStats.importedRecords}`);
        console.log(`   Ошибок: ${totalStats.errors}`);
        console.log(`   Пропущено файлов: ${totalStats.skippedFiles}`);
        console.log(`   Время выполнения: ${duration} секунд\n`);
        
        // Получаем статистику базы данных
        console.log('📊 Получение актуальной статистики базы данных...');
        const dbStats = await getDatabaseStats();
        console.log(formatStats(dbStats));
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
        process.exit(1);
    } finally {
        await disconnectFromDatabase();
    }
}

/**
 * Импорт данных для одной буквы
 */
async function importLetterData(letter, filesForLetter) {
    const letterStats = {
        processedFiles: 0,
        importedRecords: 0,
        errors: 0,
        skippedFiles: 0
    };
    
    // Импортируем файлы в определенном порядке
    for (const fileType of importConfig.importOrder) {
        const files = filesForLetter[fileType] || [];
        
        for (const fileInfo of files) {
            letterStats.processedFiles++;
            
            try {
                const result = await importDataOfType(fileInfo, {
                    clearExisting: true,
                    logLevel: importConfig.import.logLevel
                });
                
                if (result.success) {
                    letterStats.importedRecords += result.imported;
                } else {
                    console.error(`   ❌ ${fileInfo.fileName}: ${result.error}`);
                    letterStats.errors++;
                }
                
            } catch (error) {
                console.error(`   ❌ ${fileInfo.fileName}: ${error.message}`);
                letterStats.errors++;
            }
        }
    }
    
    // Проверяем неожиданные файлы
    const allFiles = Object.values(filesForLetter).flat();
    const expectedFiles = importConfig.importOrder.reduce((total, type) => total + filesForLetter[type].length, 0);
    
    if (allFiles.length > expectedFiles) {
        const unexpectedFiles = allFiles.length - expectedFiles;
        letterStats.skippedFiles += unexpectedFiles;
        console.warn(`   ⚠️ Пропущено неожиданных файлов: ${unexpectedFiles}`);
    }
    
    return letterStats;
}

/**
 * Проверка аргументов командной строки
 */
function parseCommandLineArgs() {
    const args = process.argv.slice(2);
    const options = {
        clearExisting: true,
        logLevel: 'info'
    };
    
    args.forEach(arg => {
        switch (arg) {
            case '--no-clear':
                options.clearExisting = false;
                break;
            case '--verbose':
                options.logLevel = 'verbose';
                break;
            case '--silent':
                options.logLevel = 'silent';
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
Полный импорт базы данных глаголов

Использование:
  npm run import:full [опции]

Опции:
  --no-clear    Не очищать существующие данные перед импортом
  --verbose     Подробный вывод
  --silent      Минимальный вывод
  --help        Показать эту справку

Примеры:
  npm run import:full
  npm run import:full -- --verbose
  npm run import:full -- --no-clear --silent

Описание:
  Эта команда импортирует все доступные данные глаголов из папки !db
  в базу данных MongoDB. Использует конфигурации проекта для определения
  поддерживаемых букв, времен и языков.
    `);
}

// Запускаем импорт, если файл выполняется напрямую
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
    const options = parseCommandLineArgs();
    
    // Применяем опции к конфигурации
    if (options.logLevel) {
        importConfig.import.logLevel = options.logLevel;
    }
    
    fullDatabaseImport().catch(error => {
        console.error('💥 Неожиданная ошибка:', error);
        process.exit(1);
    });
} 