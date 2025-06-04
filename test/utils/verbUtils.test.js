import { expect } from 'chai';
import { getVerbData } from '../../utils/verbUtils.js';
import { getVerbModel, getVerbTranslationModel } from '../../models/verb.js';
import { initTestDatabase } from '../setup/testServer.js';
import { disconnectFromDatabase } from '../../db.js';

describe('VerbUtils', () => {
    before(async () => {
        await initTestDatabase();
    });

    after(async () => {
        await disconnectFromDatabase();
    });

    beforeEach(async () => {
        // Очищаем тестовые данные перед каждым тестом
        try {
            const VerbModelA = getVerbModel('a');
            await VerbModelA.deleteMany({});
            
            const VerbTranslationModelA = getVerbTranslationModel('a', 'ru');
            await VerbTranslationModelA.deleteMany({});
        } catch (error) {
            // Модели могут не существовать, это нормально
        }
    });

    describe('getVerbData()', () => {
        it('должен возвращать данные для конкретного глагола', async () => {
            // Подготавливаем тестовые данные
            const VerbModelA = getVerbModel('a');
            await VerbModelA.create({ 
                verb_id: 1, 
                verb: 'arbeiten' 
            });

            const VerbTranslationModelA = getVerbTranslationModel('a', 'ru');
            await VerbTranslationModelA.create({
                verb_id: 1,
                translations: ['работать']
            });

            const result = await getVerbData('a', 'arbeiten', false);

            expect(result).to.have.property('verb');
            expect(result.verb.verb).to.equal('arbeiten');
            expect(result).to.have.property('translation');
            expect(result).to.have.property('conjugations');
            expect(result).to.have.property('sentences');
            expect(result).to.have.property('sentencesTranslation');
        });

        it('должен возвращать случайный глагол когда random=true', async () => {
            // Подготавливаем тестовые данные
            const VerbModelA = getVerbModel('a');
            await VerbModelA.create({ 
                verb_id: 1, 
                verb: 'arbeiten' 
            });
            await VerbModelA.create({ 
                verb_id: 2, 
                verb: 'antworten' 
            });

            const VerbTranslationModelA = getVerbTranslationModel('a', 'ru');
            await VerbTranslationModelA.create({
                verb_id: 1,
                translations: ['работать']
            });
            await VerbTranslationModelA.create({
                verb_id: 2,
                translations: ['отвечать']
            });

            const result = await getVerbData('a', '', true);

            expect(result).to.have.property('verb');
            expect(['arbeiten', 'antworten']).to.include(result.verb.verb);
            expect(result).to.have.property('translation');
        });

        it('должен выбрасывать ошибку для несуществующего глагола', async () => {
            try {
                await getVerbData('a', 'nonexistent', false);
                expect.fail('Ожидалась ошибка');
            } catch (error) {
                expect(error.message).to.include('nonexistent');
            }
        });

        it('должен выбрасывать ошибку когда нет глаголов для случайного выбора', async () => {
            try {
                await getVerbData('a', '', true);
                expect.fail('Ожидалась ошибка');
            } catch (error) {
                expect(error.message).to.include('Ошибка при получении данных для глагола');
            }
        });

        it('должен корректно обрабатывать ошибки для случайного глагола', async () => {
            // Создаем глагол без перевода чтобы вызвать ошибку
            const VerbModelA = getVerbModel('a');
            await VerbModelA.create({ 
                verb_id: 1, 
                verb: 'test' 
            });

            try {
                await getVerbData('a', '', true);
                expect.fail('Ожидалась ошибка');
            } catch (error) {
                // Проверяем что в сообщении об ошибке указан правильный глагол
                expect(error.message).to.include('test');
                expect(error.message).to.not.include('""'); // не должно быть пустой строки
            }
        });

        it('должен выбрасывать ошибку для невалидной буквы', async () => {
            try {
                await getVerbData('invalid', 'test', false);
                expect.fail('Ожидалась ошибка');
            } catch (error) {
                expect(error.message).to.include('invalid');
            }
        });
    });
}); 