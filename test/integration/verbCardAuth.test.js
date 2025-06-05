import { expect } from 'chai';
import request from 'supertest';
import { createTestUser, cleanTestData } from '../utils/testHelpers.js';
import { createTestApp, initTestDatabase } from '../setup/testServer.js';

describe('Verb Card Authentication Tests', () => {
    let app;
    let testUser, testToken;

    before(async () => {
        await initTestDatabase();
        app = createTestApp();
    });

    beforeEach(async () => {
        await cleanTestData();
        const userData = await createTestUser();
        testUser = userData.user;
        testToken = userData.token;
        
        // Создаем тестовые глаголы для проверки карточек
        await createTestVerbs();
    });

    async function createTestVerbs() {
        const { getVerbModel, getVerbTranslationModel } = await import('../../models/verb.js');
        const VerbModel = getVerbModel('a');
        const VerbTranslationModel = getVerbTranslationModel('a', 'ru');
        
        // Генерируем уникальный verb_id для каждого теста
        const verbId = Math.floor(Math.random() * 10000) + Date.now() % 10000;
        
        // Создаем тестовый глагол
        await VerbModel.create({
            verb_id: verbId,
            verb: `arbeiten${verbId}` // Делаем verb уникальным тоже
        });

        // Создаем тестовый перевод
        await VerbTranslationModel.create({
            verb_id: verbId,
            verb: ['работать', 'трудиться']
        });
    }

    afterEach(async () => {
        await cleanTestData();
    });

    describe('Authenticated User Card Buttons', () => {
        it('should show user action buttons for authenticated users', async () => {
            const response = await request(app)
                .get('/verbs')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);

            // Проверяем что кнопки пользователя видимы
            expect(response.text).to.include('card-user-actions');
            expect(response.text).to.include('btn-favorite');
            expect(response.text).to.include('btn-add-to-list');
            expect(response.text).to.include('data-action="toggle-favorite"');
            expect(response.text).to.include('data-action="add-to-list"');
        });

        it('should show user action buttons on card back for authenticated users', async () => {
            const response = await request(app)
                .get('/verbs')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);

            // Проверяем кнопки на обратной стороне карточки
            expect(response.text).to.include('card-user-actions-back');
            expect(response.text).to.include('btn-favorite-back');
            expect(response.text).to.include('btn-add-to-list-back');
        });

        it('should include proper data attributes for verb interaction', async () => {
            const response = await request(app)
                .get('/verbs')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);

            // Проверяем наличие data-атрибутов для JavaScript
            expect(response.text).to.include('data-verb=');
            expect(response.text).to.include('data-letter=');
            expect(response.text).to.include('data-verb-id=');
        });
    });

    describe('Unauthenticated User Card Buttons', () => {
        it('should hide user action buttons for unauthenticated users', async () => {
            const response = await request(app)
                .get('/verbs')
                .expect(200);

            // Проверяем что кнопки пользователя скрыты
            expect(response.text).to.include('style="display: none;"');
            
            // Кнопки должны присутствовать в HTML, но быть скрытыми
            expect(response.text).to.include('card-user-actions');
            expect(response.text).to.include('btn-favorite');
            expect(response.text).to.include('btn-add-to-list');
        });

        it('should show card content without user-specific functionality', async () => {
            const response = await request(app)
                .get('/verbs')
                .expect(200);

            // Основное содержимое карточки должно быть доступно
            expect(response.text).to.include('class="card"');
            expect(response.text).to.include('card-front');
            expect(response.text).to.include('card-back');
        });
    });

    describe('Token Handling', () => {
        it('should work with Bearer token in Authorization header', async () => {
            const response = await request(app)
                .get('/verbs')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);

            // При правильном токене кнопки должны быть видимы
            expect(response.text).to.not.include('style="display: none;"');
        });

        it('should handle missing Authorization header gracefully', async () => {
            const response = await request(app)
                .get('/verbs')
                .expect(200);

            // Без токена кнопки должны быть скрыты
            expect(response.text).to.include('style="display: none."');
        });

        it('should handle invalid token gracefully', async () => {
            const response = await request(app)
                .get('/verbs')
                .set('Authorization', 'Bearer invalid-token')
                .expect(200);

            // При неверном токене кнопки должны быть скрыты
            expect(response.text).to.include('style="display: none."');
        });
    });

    describe('Card Data Integrity', () => {
        it('should include all required data attributes', async () => {
            const response = await request(app)
                .get('/verbs')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);

            // Проверяем наличие всех необходимых атрибутов
            const cardMatches = response.text.match(/data-verb="[^"]+"/g);
            const letterMatches = response.text.match(/data-letter="[^"]+"/g);
            const idMatches = response.text.match(/data-verb-id="[^"]+"/g);

            if (cardMatches) {
                expect(cardMatches.length).to.be.greaterThan(0);
                expect(letterMatches.length).to.equal(cardMatches.length);
                expect(idMatches.length).to.equal(cardMatches.length);
            }
        });
    });
}); 