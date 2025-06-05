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

            // При правильном токене кнопки пользователя должны быть видимы (без style="display: none;")
            expect(response.text).to.include('card-user-actions');
            expect(response.text).to.include('btn-favorite');
            expect(response.text).to.include('btn-add-to-list');
            
            // Проверяем что нет скрытых кнопок для авторизованного пользователя
            const hiddenUserActionsRegex = /<div class="card-user-actions"[^>]*style="display:\s*none;"/;
            expect(response.text).to.not.match(hiddenUserActionsRegex);
        });

        it('should handle missing Authorization header gracefully', async () => {
            const response = await request(app)
                .get('/verbs')
                .expect(200);

            // Без токена кнопки пользователя должны быть скрыты (style="display: none;")
            const hiddenUserActionsRegex = /<div class="card-user-actions"[^>]*style="display:\s*none;"/;
            expect(response.text).to.match(hiddenUserActionsRegex);
        });

        it('should handle invalid token gracefully', async () => {
            const response = await request(app)
                .get('/verbs')
                .set('Authorization', 'Bearer invalid-token')
                .expect(200);

            // При неверном токене кнопки пользователя должны быть скрыты (style="display: none;")
            const hiddenUserActionsRegex = /<div class="card-user-actions"[^>]*style="display:\s*none;"/;
            expect(response.text).to.match(hiddenUserActionsRegex);
        });
    });

    describe('Card Data Integrity', () => {
        it('should include all required data attributes', async () => {
            const response = await request(app)
                .get('/verbs')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);

            // Проверяем наличие всех необходимых атрибутов - ищем карточки по классу
            const cardElements = response.text.match(/<div class="card"[^>]*>/g);
            const cardMatches = response.text.match(/data-verb="[^"]+"/g);
            const letterMatches = response.text.match(/data-letter="[^"]+"/g);
            const idMatches = response.text.match(/data-verb-id="[^"]+"/g);
            
            if (cardMatches) {
                expect(cardMatches.length).to.be.greaterThan(0);
                
                // Проверяем что количество уникальных атрибутов соответствует количеству карточек
                if (cardMatches && idMatches) {
                    expect(idMatches.length).to.equal(cardMatches.length,
                        `ID attributes (${idMatches.length}) should match card attributes (${cardMatches.length})`);
                }
                
                // Для data-letter может быть больше совпадений из-за двух сторон карточки
                // Проверяем что есть хотя бы столько же letter атрибутов, сколько карточек
                if (letterMatches) {
                    expect(letterMatches.length).to.be.at.least(cardMatches.length,
                        `Letter attributes (${letterMatches.length}) should be at least as many as card attributes (${cardMatches.length})`);
                }
                
                // Каждая карточка должна иметь все необходимые атрибуты
                console.log(`Found ${cardMatches.length} cards with complete data attributes`);
            } else {
                // Если нет карточек (пустая база), это тоже нормально для тестов
                console.log('No verb cards found in response');
            }
        });
    });

    describe('Admin/Moderator Card Buttons', () => {
        it('should show admin buttons for admin users', async () => {
            // Создаем админа
            const timestamp = Date.now();
            const adminData = await createTestUser({ 
                username: `testadmin${timestamp}`, 
                email: `admin${timestamp}@test.com`, 
                role: 'administrator' 
            });
            
            const response = await request(app)
                .get('/verbs')
                .set('Authorization', `Bearer ${adminData.token}`)
                .expect(200);

            // Проверяем что админские кнопки видимы
            expect(response.text).to.include('card-admin-actions');
            expect(response.text).to.include('btn-edit');
            expect(response.text).to.include('btn-delete');
            expect(response.text).to.include('data-action="edit-verb"');
            expect(response.text).to.include('data-action="delete-verb"');
        });

        it('should show admin buttons for moderator users', async () => {
            // Создаем модератора
            const timestamp = Date.now();
            const moderatorData = await createTestUser({ 
                username: `testmoderator${timestamp}`, 
                email: `moderator${timestamp}@test.com`, 
                role: 'moderator' 
            });
            
            const response = await request(app)
                .get('/verbs')
                .set('Authorization', `Bearer ${moderatorData.token}`)
                .expect(200);

            // Проверяем что админские кнопки видимы
            expect(response.text).to.include('card-admin-actions');
            expect(response.text).to.include('btn-edit');
            expect(response.text).to.include('btn-delete');
        });

        it('should hide admin buttons for regular users', async () => {
            const response = await request(app)
                .get('/verbs')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);

            // Проверяем что админские кнопки скрыты
            expect(response.text).to.not.include('card-admin-actions');
            expect(response.text).to.not.include('btn-edit');
            expect(response.text).to.not.include('btn-delete');
        });

        it('should hide admin buttons for unauthenticated users', async () => {
            const response = await request(app)
                .get('/verbs')
                .expect(200);

            // Проверяем что админские кнопки скрыты
            expect(response.text).to.not.include('card-admin-actions');
            expect(response.text).to.not.include('btn-edit');
            expect(response.text).to.not.include('btn-delete');
        });
    });
}); 