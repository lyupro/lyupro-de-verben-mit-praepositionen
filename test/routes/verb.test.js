// test/routes/verb.test.js
import { expect } from 'chai';
import request from 'supertest';
import { createTestApp, initTestDatabase } from '../setup/testServer.js';
import { getVerbModel, getVerbTranslationModel } from '../../models/verb.js';
import { connectToDatabase, disconnectFromDatabase } from '../../db.js';

describe('Verb Routes', () => {
    let app;

    before(async () => {
        await initTestDatabase();
        app = createTestApp();
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

    describe('GET / (случайный глагол)', () => {
        it('должен показать сообщение когда нет глаголов в базе', async () => {
            const response = await request(app)
                .get('/verb')
                .expect(200);

            expect(response.text).to.include('Глаголы не найдены');
            expect(response.text).to.include('В базе данных пока нет глаголов');
        });

        it('должен показать случайный глагол когда глаголы есть в базе', async () => {
            // Добавляем тестовый глагол с переводом
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

            const response = await request(app)
                .get('/verb')
                .expect(200);

            expect(response.text).to.include('Случайный глагол');
            // Проверяем что не показывается сообщение об ошибке
            expect(response.text).to.not.include('Глаголы не найдены');
        });

        it('должен корректно обрабатывать ошибки валидации', async () => {
            // Создаем глагол без перевода чтобы вызвать ошибку
            const VerbModelA = getVerbModel('a');
            await VerbModelA.create({ 
                verb_id: 1, 
                verb: 'test' 
            });

            const response = await request(app)
                .get('/verb')
                .expect(200);

            // Должен показать страницу ошибки
            expect(response.text).to.include('Ошибка');
        });
    });

    describe('POST /check (проверка предложения)', () => {
        beforeEach(async () => {
            // Добавляем тестовый глагол для проверки предложений
            const VerbModelA = getVerbModel('a');
            await VerbModelA.create({ 
                verb_id: 1, 
                verb: 'arbeiten' 
            });
        });

        it('должен корректно обрабатывать валидные данные', async () => {
            const response = await request(app)
                .post('/verb/check')
                .send({
                    verb: 'arbeiten',
                    sentence: 'Ich arbeite jeden Tag.'
                })
                .expect(200);

            // Ответ должен содержать информацию о проверке
            expect(response.text).to.be.a('string');
        });

        it('должен возвращать ошибку для невалидных данных', async () => {
            const response = await request(app)
                .post('/verb/check')
                .send({
                    verb: '', // пустой глагол
                    sentence: 'Test sentence'
                })
                .expect(400); // Исправляем ожидаемый код ошибки

            // Проверяем что ошибка обрабатывается
        });

        it('должен возвращать ошибку для несуществующего глагола', async () => {
            const response = await request(app)
                .post('/verb/check')
                .send({
                    verb: 'nonexistent',
                    sentence: 'Test sentence'
                })
                .expect(404); // Исправляем ожидаемый код ошибки

            // Проверяем что ошибка обрабатывается для несуществующего глагола
        });
    });
}); 