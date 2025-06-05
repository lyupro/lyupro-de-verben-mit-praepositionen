import alphabetConfig from './alphabet.js';
import verbTensesConfig from './verbTenses.js';
import languagesConfig from './languages.js';
import databaseConfig from './database.js';

export default {
    // Паттерны имен файлов
    filePatterns: {
        verbs: 'de_verbs_{letter}.json',
        translations: 'de_verbs_{letter}_translations_{language}.json',
        tenses: 'de_verbs_{letter}_tenses_{tense}.json',
        sentences: 'de_verbs_{letter}_sentences_{tense}.json',
        sentenceTranslations: 'de_verbs_{letter}_sentences_{tense}_{language}.json'
    },

    // Используем конфиги приложения как источник истины
    supportedLetters: alphabetConfig.getAll(),
    supportedTenses: verbTensesConfig.tenses,
    supportedLanguages: languagesConfig.languages,
    
    // Пути и настройки
    paths: {
        dataSource: '!db',
        backupDir: 'backups'
    },
    
    // База данных
    database: {
        uri: databaseConfig.mongoURI,
        options: {
            // Современные настройки для Mongoose 6+
        }
    },
    
    // Настройки импорта
    import: {
        batchSize: 100,
        logLevel: 'info', // 'silent', 'info', 'verbose'
        continueOnError: true,
        validateJson: true
    },
    
    // Приоритет типов файлов для импорта (в порядке важности)
    importOrder: [
        'verbs',           // Сначала основные глаголы
        'translations',    // Затем переводы
        'tenses',          // Потом спряжения
        'sentences',       // Затем предложения
        'sentenceTranslations' // И наконец переводы предложений
    ],

    // Функции для генерации имен файлов
    generateFileName(type, letter, tense = null, language = null) {
        const patterns = this.filePatterns;
        let pattern;
        
        switch (type) {
            case 'verbs':
                pattern = patterns.verbs;
                break;
            case 'translations':
                pattern = patterns.translations;
                break;
            case 'tenses':
                pattern = patterns.tenses;
                break;
            case 'sentences':
                pattern = patterns.sentences;
                break;
            case 'sentenceTranslations':
                pattern = patterns.sentenceTranslations;
                break;
            default:
                throw new Error(`Unknown file type: ${type}`);
        }
        
        return pattern
            .replace('{letter}', letter)
            .replace('{tense}', tense || '')
            .replace('{language}', language || '');
    },

    // Функция для парсинга имени файла
    parseFileName(fileName) {
        const match = fileName.match(/^de_verbs_([a-z]+|ae|oe|ue|ss)(?:_(.+))?\.json$/);
        if (!match) return null;
        
        const letter = match[1];
        const suffix = match[2];
        
        if (!suffix) {
            return { type: 'verbs', letter };
        }
        
        // Проверяем переводы
        for (const lang of this.supportedLanguages) {
            if (suffix === `translations_${lang}`) {
                return { type: 'translations', letter, language: lang };
            }
        }
        
        // Проверяем времена
        for (const tense of this.supportedTenses) {
            if (suffix === `tenses_${tense}`) {
                return { type: 'tenses', letter, tense };
            }
            if (suffix === `sentences_${tense}`) {
                return { type: 'sentences', letter, tense };
            }
            
            // Проверяем переводы предложений
            for (const lang of this.supportedLanguages) {
                if (suffix === `sentences_${tense}_${lang}`) {
                    return { type: 'sentenceTranslations', letter, tense, language: lang };
                }
            }
        }
        
        return null; // Неизвестный тип файла
    }
}; 