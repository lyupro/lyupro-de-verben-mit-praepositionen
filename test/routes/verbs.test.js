import { expect } from 'chai';
import request from 'supertest';
import { createTestApp, initTestDatabase } from '../setup/testServer.js';
import { getVerbModel, getVerbTranslationModel } from '../../models/verb.js';
import { connectToDatabase, disconnectFromDatabase } from '../../db.js';

describe('Verbs Routes', () => {
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
            console.warn('Cleanup error:', error.message);
        }
    });

    describe('GET /verbs (список всех глаголов)', () => {
        it('должен отображать страницу с пустым списком когда нет глаголов', async () => {
            const response = await request(app)
                .get('/verbs')
                .expect(200);

            expect(response.text).to.include('Список глаголов');
            // Проверяем что нет ошибок типа "pageHeader is not defined"
            expect(response.text).to.not.include('pageHeader is not defined');
            expect(response.text).to.not.include('ReferenceError');
        });

        it('должен отображать список глаголов с переводами', async () => {
            // Создаем тестовый глагол
            const VerbModelA = getVerbModel('a');
            const testVerb = await VerbModelA.create({
                verb_id: 0,
                verb: 'arbeiten'
            });

            // Создаем перевод
            const VerbTranslationModelA = getVerbTranslationModel('a', 'ru');
            await VerbTranslationModelA.create({
                verb_id: 0,
                verb: ['работать']
            });

            const response = await request(app)
                .get('/verbs')
                .expect(200);

            expect(response.text).to.include('arbeiten');
            expect(response.text).to.include('работать');
            expect(response.text).to.include('Список глаголов');
        });

        it('должен корректно обрабатывать пагинацию', async () => {
            // Создаем несколько глаголов для тестирования пагинации
            const VerbModelA = getVerbModel('a');
            const VerbTranslationModelA = getVerbTranslationModel('a', 'ru');

            for (let i = 0; i <= 14; i++) {
                await VerbModelA.create({
                    verb_id: i,
                    verb: `arbeiten${i.toString().padStart(2, '0')}`  // arbeiten00, arbeiten01, etc.
                });

                await VerbTranslationModelA.create({
                    verb_id: i,
                    verb: [`работать${i}`]
                });
            }

            // Тестируем первую страницу
            const response1 = await request(app)
                .get('/verbs')
                .expect(200);

            expect(response1.text).to.include('arbeiten00');
            expect(response1.text).to.include('работать0');

            // Тестируем вторую страницу
            const response2 = await request(app)
                .get('/verbs/2')
                .expect(200);

            // На второй странице должны быть глаголы с номерами 10-14
            expect(response2.text).to.include('arbeiten10');
        });

        it('должен перенаправлять на первую страницу при неверном номере страницы', async () => {
            // Создаем тестовый глагол
            const VerbModelA = getVerbModel('a');
            await VerbModelA.create({
                verb_id: 0,
                verb: 'arbeiten'
            });

            const response = await request(app)
                .get('/verbs/999')
                .expect(302);

            expect(response.headers.location).to.include('/verbs/1');
        });
    });

    describe('GET /verbs/search (поиск глаголов)', () => {
        it('должен найти глаголы по запросу', async () => {
            // Создаем тестовые глаголы
            const VerbModelA = getVerbModel('a');
            const VerbTranslationModelA = getVerbTranslationModel('a', 'ru');

            await VerbModelA.create({ verb_id: 0, verb: 'arbeiten' });
            await VerbModelA.create({ verb_id: 1, verb: 'antworten' });

            await VerbTranslationModelA.create({
                verb_id: 0,
                verb: ['работать']
            });
            await VerbTranslationModelA.create({
                verb_id: 1,
                verb: ['отвечать']
            });

            const response = await request(app)
                .get('/verbs/search?q=arb')
                .expect(200);

            const verbs = JSON.parse(response.text);
            expect(verbs).to.be.an('array');
            expect(verbs[0].verb).to.equal('arbeiten');
            expect(verbs[0].translation).to.equal('работать');
        });

        it('должен возвращать ошибку при отсутствии запроса', async () => {
            const response = await request(app)
                .get('/verbs/search')
                .expect(400);
        });

        it('должен возвращать пустой массив если ничего не найдено', async () => {
            const response = await request(app)
                .get('/verbs/search?q=xyz')
                .expect(200);

            const verbs = JSON.parse(response.text);
            expect(verbs).to.be.an('array');
            expect(verbs).to.have.length(0);
        });
    });

    describe('GET /verbs/:letter (глаголы по букве)', () => {
        it('должен отображать глаголы для указанной буквы', async () => {
            const VerbModelA = getVerbModel('a');
            const VerbTranslationModelA = getVerbTranslationModel('a', 'ru');

            await VerbModelA.create({ verb_id: 0, verb: 'arbeiten' });
            await VerbTranslationModelA.create({
                verb_id: 0,
                verb: ['работать']
            });

            const response = await request(app)
                .get('/verbs/a')
                .expect(200);

            expect(response.text).to.include('arbeiten');
            expect(response.text).to.include('работать');
        });

        it('должен возвращать ошибку для некорректной буквы', async () => {
            const response = await request(app)
                .get('/verbs/invalid')
                .timeout(5000) // 5 секунд timeout
                .expect(400); // Ожидаем 400 т.к. это валидационная ошибка
        }).timeout(6000); // Увеличиваем timeout для теста
    });

    describe('GET /verbs/:letter/:verb (конкретный глагол)', () => {
        it('должен отображать детали конкретного глагола', async () => {
            const VerbModelA = getVerbModel('a');
            const VerbTranslationModelA = getVerbTranslationModel('a', 'ru');

            await VerbModelA.create({ verb_id: 0, verb: 'arbeiten' });
            await VerbTranslationModelA.create({
                verb_id: 0,
                verb: ['работать']
            });

            const response = await request(app)
                .get('/verbs/a/arbeiten')
                .expect(200);

            expect(response.text).to.include('arbeiten');
            expect(response.text).to.include('работать');
        });

        it('должен возвращать ошибку для несуществующего глагола', async () => {
            const response = await request(app)
                .get('/verbs/a/nonexistent')
                .expect(500); // Ожидаем 500 т.к. это обрабатывается как server error
        });
    });

    describe('Обработка ошибок шаблонов', () => {
        it('должен передавать все необходимые параметры в шаблон verbs.ejs', async () => {
            const response = await request(app)
                .get('/verbs')
                .expect(200);

            // Проверяем что нет ошибок типа "pageHeader is not defined"
            expect(response.text).to.not.include('pageHeader is not defined');
            expect(response.text).to.not.include('ReferenceError');
        });

        it('должен корректно обрабатывать отсутствие переводов', async () => {
            // Создаем глагол без перевода
            const VerbModelA = getVerbModel('a');
            await VerbModelA.create({ verb_id: 0, verb: 'testverb' });

            const response = await request(app)
                .get('/verbs')
                .expect(200);

            expect(response.text).to.include('testverb');
            expect(response.text).to.include('Перевод не найден');
        });
    });
}); 