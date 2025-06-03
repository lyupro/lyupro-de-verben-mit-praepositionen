import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import importConfig from '../config/importConfig.js';
import { createModels, getVerbModel, getVerbTranslationModel, getVerbTensesModel, getVerbSentencesModel, getVerbSentencesTranslationModel } from '../models/verb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

/**
 * Подключение к базе данных
 */
export async function connectToDatabase() {
    try {
        await mongoose.connect(importConfig.database.uri, importConfig.database.options);
        console.log('✅ Подключено к MongoDB:', importConfig.database.uri);
        
        // Создаем модели для всех букв, времен и языков
        await createModels();
        console.log('✅ Модели Mongoose созданы');
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка подключения к MongoDB:', error.message);
        throw error;
    }
}

/**
 * Отключение от базы данных
 */
export async function disconnectFromDatabase() {
    try {
        await mongoose.disconnect();
        console.log('✅ Отключено от MongoDB');
    } catch (error) {
        console.error('❌ Ошибка отключения от MongoDB:', error.message);
    }
}

/**
 * Сканирование файлов для определенной буквы
 */
export function scanFilesForLetter(letter) {
    const dataPath = path.join(rootDir, importConfig.paths.dataSource);
    
    if (!fs.existsSync(dataPath)) {
        throw new Error(`Папка с данными не найдена: ${dataPath}`);
    }
    
    const allFiles = fs.readdirSync(dataPath);
    const letterFiles = allFiles.filter(file => {
        const parsed = importConfig.parseFileName(file);
        return parsed && parsed.letter === letter;
    });
    
    // Группируем файлы по типам
    const filesByType = {
        verbs: [],
        translations: [],
        tenses: [],
        sentences: [],
        sentenceTranslations: []
    };
    
    letterFiles.forEach(file => {
        const parsed = importConfig.parseFileName(file);
        if (parsed && filesByType[parsed.type]) {
            filesByType[parsed.type].push({
                fileName: file,
                filePath: path.join(dataPath, file),
                ...parsed
            });
        }
    });
    
    return filesByType;
}

/**
 * Безопасная загрузка JSON файла
 */
export function loadJsonSafe(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'Файл не найден', data: null };
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        if (importConfig.import.validateJson) {
            // Базовая валидация
            if (!Array.isArray(data)) {
                return { success: false, error: 'Файл должен содержать массив', data: null };
            }
        }
        
        return { success: true, error: null, data };
    } catch (error) {
        return { success: false, error: error.message, data: null };
    }
}

/**
 * Получение модели Mongoose для определенного типа данных
 */
export function getModelForType(type, letter, tense = null, language = null) {
    try {
        switch (type) {
            case 'verbs':
                return getVerbModel(letter);
            case 'translations':
                return getVerbTranslationModel(letter, language);
            case 'tenses':
                return getVerbTensesModel(letter, tense);
            case 'sentences':
                return getVerbSentencesModel(letter, tense);
            case 'sentenceTranslations':
                return getVerbSentencesTranslationModel(letter, tense, language);
            default:
                throw new Error(`Неизвестный тип данных: ${type}`);
        }
    } catch (error) {
        console.error(`❌ Ошибка получения модели для ${type}:`, error.message);
        return null;
    }
}

/**
 * Импорт данных определенного типа
 */
export async function importDataOfType(fileInfo, options = {}) {
    const { fileName, filePath, type, letter, tense, language } = fileInfo;
    const { clearExisting = true, logLevel = 'info' } = options;
    
    try {
        // Загружаем данные из файла
        const loadResult = loadJsonSafe(filePath);
        if (!loadResult.success) {
            return { success: false, error: loadResult.error, imported: 0 };
        }
        
        const data = loadResult.data;
        
        // Получаем модель
        const Model = getModelForType(type, letter, tense, language);
        if (!Model) {
            return { success: false, error: 'Не удалось получить модель', imported: 0 };
        }
        
        // Очищаем существующие данные если нужно
        if (clearExisting) {
            await Model.deleteMany({});
            if (logLevel === 'verbose') {
                console.log(`  🧹 Очищены существующие данные для ${fileName}`);
            }
        }
        
        // Импортируем данные
        let imported = 0;
        const batchSize = importConfig.import.batchSize;
        
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            
            try {
                await Model.insertMany(batch, { ordered: false });
                imported += batch.length;
            } catch (error) {
                if (importConfig.import.continueOnError) {
                    console.warn(`  ⚠️ Ошибка в батче ${i}-${i + batch.length} для ${fileName}: ${error.message}`);
                } else {
                    throw error;
                }
            }
        }
        
        if (logLevel !== 'silent') {
            console.log(`  ✅ ${fileName}: импортировано ${imported} записей`);
        }
        
        return { success: true, error: null, imported };
        
    } catch (error) {
        return { success: false, error: error.message, imported: 0 };
    }
}

/**
 * Получение статистики базы данных
 */
export async function getDatabaseStats() {
    const stats = {
        letters: {},
        totalCollections: 0,
        totalDocuments: 0
    };
    
    for (const letter of importConfig.supportedLetters) {
        const letterStats = {
            verbs: 0,
            translations: 0,
            tenses: 0,
            sentences: 0,
            sentenceTranslations: 0
        };
        
        try {
            // Глаголы
            const verbModel = getVerbModel(letter);
            letterStats.verbs = await verbModel.countDocuments();
            
            // Переводы
            for (const language of importConfig.supportedLanguages) {
                const translationModel = getVerbTranslationModel(letter, language);
                letterStats.translations += await translationModel.countDocuments();
            }
            
            // Времена и предложения
            for (const tense of importConfig.supportedTenses) {
                const tenseModel = getVerbTensesModel(letter, tense);
                letterStats.tenses += await tenseModel.countDocuments();
                
                const sentenceModel = getVerbSentencesModel(letter, tense);
                letterStats.sentences += await sentenceModel.countDocuments();
                
                for (const language of importConfig.supportedLanguages) {
                    const sentenceTranslationModel = getVerbSentencesTranslationModel(letter, tense, language);
                    letterStats.sentenceTranslations += await sentenceTranslationModel.countDocuments();
                }
            }
            
        } catch (error) {
            // Модель может не существовать, это нормально
        }
        
        stats.letters[letter] = letterStats;
        stats.totalDocuments += Object.values(letterStats).reduce((sum, count) => sum + count, 0);
    }
    
    return stats;
}

/**
 * Форматирование статистики для вывода
 */
export function formatStats(stats) {
    let output = '\n📊 Статистика базы данных:\n';
    output += '================================\n';
    
    let totalsByType = {
        verbs: 0,
        translations: 0,
        tenses: 0,
        sentences: 0,
        sentenceTranslations: 0
    };
    
    Object.entries(stats.letters).forEach(([letter, letterStats]) => {
        const total = Object.values(letterStats).reduce((sum, count) => sum + count, 0);
        if (total > 0) {
            output += `${letter.toUpperCase()}: ${total} записей `;
            output += `(глаг: ${letterStats.verbs}, пер: ${letterStats.translations}, `;
            output += `врем: ${letterStats.tenses}, пред: ${letterStats.sentences}, `;
            output += `пер.пред: ${letterStats.sentenceTranslations})\n`;
            
            Object.keys(totalsByType).forEach(type => {
                totalsByType[type] += letterStats[type];
            });
        }
    });
    
    output += '================================\n';
    output += `📈 Итого: ${stats.totalDocuments} записей\n`;
    output += `   Глаголы: ${totalsByType.verbs}\n`;
    output += `   Переводы: ${totalsByType.translations}\n`;
    output += `   Времена: ${totalsByType.tenses}\n`;
    output += `   Предложения: ${totalsByType.sentences}\n`;
    output += `   Переводы предложений: ${totalsByType.sentenceTranslations}\n`;
    
    return output;
} 