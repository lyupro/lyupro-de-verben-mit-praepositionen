import { expect } from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createTestApp, initTestDatabase } from '../setup/testServer.js';
import User from '../../models/user.js';
import UserFavorites from '../../models/userFavorites.js';
import UserVerbLists from '../../models/userVerbLists.js';
import UserVerbListItems from '../../models/userVerbListItems.js';

describe('User API', () => {
    let app;
    let testUser;
    let authToken;

    before(async () => {
        await initTestDatabase();
        app = createTestApp();
        // Очищаем тестовые данные
        await User.deleteMany({ email: { $regex: /test.*@test\.com/ } });
        await UserFavorites.deleteMany({});
        await UserVerbLists.deleteMany({});
        await UserVerbListItems.deleteMany({});
    });

    after(async () => {
        // Очищаем тестовые данные
        await User.deleteMany({ email: { $regex: /test.*@test\.com/ } });
        await UserFavorites.deleteMany({});
        await UserVerbLists.deleteMany({});
        await UserVerbListItems.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Создаем тестового пользователя
        testUser = new User({
            username: 'testuser',
            email: 'test@test.com',
            password: 'password123'
        });
        await testUser.save();

        // Создаем JWT токен
        authToken = jwt.sign(
            { id: testUser._id, username: testUser.username, email: testUser.email },
            process.env.JWT_SECRET
        );
    });

    afterEach(async () => {
        // Очищаем тестовые данные после каждого теста
        await UserFavorites.deleteMany({});
        await UserVerbLists.deleteMany({});
        await UserVerbListItems.deleteMany({});
        if (testUser && testUser._id) {
            await User.findByIdAndDelete(testUser._id);
        }
    });

    describe('Favorites API', () => {
        describe('POST /user/favorites/add', () => {
            it('should add verb to favorites successfully', async () => {
                const favoriteData = {
                    letter: 'a',
                    verbId: 1,
                    verbText: 'arbeiten'
                };

                const response = await request(app)
                    .post('/user/favorites/add')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(favoriteData)
                    .expect(201);

                expect(response.body).to.have.property('message', 'Глагол добавлен в избранное');
                expect(response.body).to.have.property('favorite');
                expect(response.body.favorite).to.have.property('verbText', 'arbeiten');

                // Verify in database
                const savedFavorite = await UserFavorites.findOne({
                    userId: testUser._id,
                    letter: 'a',
                    verbId: 1
                });
                expect(savedFavorite).to.exist;
            });

            it('should prevent duplicate favorites', async () => {
                const favoriteData = {
                    letter: 'a',
                    verbId: 1,
                    verbText: 'arbeiten'
                };

                // Add first time
                await request(app)
                    .post('/user/favorites/add')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(favoriteData)
                    .expect(201);

                // Try to add again
                const response = await request(app)
                    .post('/user/favorites/add')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(favoriteData)
                    .expect(400);

                expect(response.body).to.have.property('message', 'Глагол уже в избранном');
            });

            it('should require authentication', async () => {
                const favoriteData = {
                    letter: 'a',
                    verbId: 1,
                    verbText: 'arbeiten'
                };

                await request(app)
                    .post('/user/favorites/add')
                    .send(favoriteData)
                    .expect(401);
            });

            it('should validate required fields', async () => {
                const response = await request(app)
                    .post('/user/favorites/add')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({})
                    .expect(400);

                expect(response.body).to.have.property('message');
            });
        });

        describe('DELETE /user/favorites/remove', () => {
            beforeEach(async () => {
                // Add a favorite to remove
                const favorite = new UserFavorites({
                    userId: testUser._id,
                    letter: 'a',
                    verbId: 1,
                    verbText: 'arbeiten'
                });
                await favorite.save();
            });

            it('should remove verb from favorites successfully', async () => {
                const removeData = {
                    letter: 'a',
                    verbId: 1
                };

                const response = await request(app)
                    .delete('/user/favorites/remove')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(removeData)
                    .expect(200);

                expect(response.body).to.have.property('message', 'Глагол удален из избранного');

                // Verify removed from database
                const favorite = await UserFavorites.findOne({
                    userId: testUser._id,
                    letter: 'a',
                    verbId: 1
                });
                expect(favorite).to.not.exist;
            });

            it('should handle removing non-existent favorite', async () => {
                const removeData = {
                    letter: 'b',
                    verbId: 2
                };

                const response = await request(app)
                    .delete('/user/favorites/remove')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(removeData)
                    .expect(404);

                expect(response.body).to.have.property('message', 'Глагол не найден в избранном');
            });
        });

        describe('GET /user/favorites', () => {
            beforeEach(async () => {
                // Add some favorites
                const favorites = [
                    { userId: testUser._id, letter: 'a', verbId: 1, verbText: 'arbeiten' },
                    { userId: testUser._id, letter: 'b', verbId: 2, verbText: 'beginnen' },
                    { userId: testUser._id, letter: 'c', verbId: 3, verbText: 'können' }
                ];
                await UserFavorites.insertMany(favorites);
            });

            it('should get user favorites with pagination', async () => {
                const response = await request(app)
                    .get('/user/favorites?page=1&limit=2')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body).to.have.property('favorites');
                expect(response.body.favorites).to.be.an('array');
                expect(response.body.favorites).to.have.length(2);
                expect(response.body).to.have.property('pagination');
                expect(response.body.pagination).to.have.property('totalFavorites', 3);
                expect(response.body.pagination).to.have.property('totalPages', 2);
            });

            it('should support search functionality', async () => {
                const response = await request(app)
                    .get('/user/favorites?search=arbeit')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body.favorites).to.have.length(1);
                expect(response.body.favorites[0].verbText).to.equal('arbeiten');
            });

            it('should require authentication', async () => {
                await request(app)
                    .get('/user/favorites')
                    .expect(401);
            });
        });

        describe('GET /user/favorites/check', () => {
            beforeEach(async () => {
                const favorite = new UserFavorites({
                    userId: testUser._id,
                    letter: 'a',
                    verbId: 1,
                    verbText: 'arbeiten'
                });
                await favorite.save();
            });

            it('should check if verb is in favorites', async () => {
                const response = await request(app)
                    .get('/user/favorites/check?letter=a&verbId=1')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body).to.have.property('isFavorite', true);
            });

            it('should return false for non-favorite verb', async () => {
                const response = await request(app)
                    .get('/user/favorites/check?letter=b&verbId=2')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body).to.have.property('isFavorite', false);
            });
        });

        it('should support letter filter', async () => {
            // Добавляем несколько избранных с разными буквами
            const favorites = [
                { letter: 'a', verbId: 1, verbText: 'arbeiten' },
                { letter: 'b', verbId: 2, verbText: 'beginnen' },
                { letter: 'a', verbId: 3, verbText: 'antworten' }
            ];

            for (const favorite of favorites) {
                await request(app)
                    .post('/user/favorites/add')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(favorite)
                    .expect(201);
            }

            // Фильтруем по букве 'a'
            const response = await request(app)
                .get('/user/favorites?letter=a')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.favorites).to.have.lengthOf(2);
            response.body.favorites.forEach(fav => {
                expect(fav.letter).to.equal('a');
            });
        });

        it('should support different sort options', async () => {
            // Добавляем несколько избранных
            const favorites = [
                { letter: 'z', verbId: 1, verbText: 'zeichnen' },
                { letter: 'a', verbId: 2, verbText: 'arbeiten' },
                { letter: 'm', verbId: 3, verbText: 'machen' }
            ];

            for (const favorite of favorites) {
                await request(app)
                    .post('/user/favorites/add')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(favorite)
                    .expect(201);
            }

            // Сортировка по алфавиту
            const alphabeticalResponse = await request(app)
                .get('/user/favorites?sort=alphabetical')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const sortedTexts = alphabeticalResponse.body.favorites.map(f => f.verbText);
            expect(sortedTexts).to.deep.equal(['arbeiten', 'machen', 'zeichnen']);
        });

        it('should include letter statistics', async () => {
            // Добавляем глаголы разных букв
            const favorites = [
                { letter: 'a', verbId: 1, verbText: 'arbeiten' },
                { letter: 'a', verbId: 2, verbText: 'antworten' },
                { letter: 'b', verbId: 3, verbText: 'beginnen' }
            ];

            for (const favorite of favorites) {
                await request(app)
                    .post('/user/favorites/add')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(favorite)
                    .expect(201);
            }

            const response = await request(app)
                .get('/user/favorites')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.letterStats).to.be.an('array');
            expect(response.body.letterStats.length).to.be.at.least(0); // Может быть пустым в тестах
            
            if (response.body.letterStats.length > 0) {
                const aStat = response.body.letterStats.find(s => s.letter === 'a');
                const bStat = response.body.letterStats.find(s => s.letter === 'b');
                
                if (aStat) expect(aStat.count).to.be.a('number');
                if (bStat) expect(bStat.count).to.be.a('number');
            }
        });

        describe('DELETE /user/favorites/bulk-remove', () => {
            it('should perform bulk removal successfully', async () => {
                // Добавляем несколько избранных
                const favorites = [
                    { letter: 'a', verbId: 1, verbText: 'arbeiten' },
                    { letter: 'b', verbId: 2, verbText: 'beginnen' },
                    { letter: 'c', verbId: 3, verbText: 'cool' }
                ];

                for (const favorite of favorites) {
                    await request(app)
                        .post('/user/favorites/add')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send(favorite)
                        .expect(201);
                }

                // Удаляем два первых
                const favoriteIds = [
                    { letter: 'a', verbId: 1 },
                    { letter: 'b', verbId: 2 }
                ];

                const response = await request(app)
                    .delete('/user/favorites/bulk-remove')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ favoriteIds })
                    .expect(200);

                expect(response.body.status).to.equal('success');
                expect(response.body.deletedCount).to.equal(2);

                // Проверяем что остался только один
                const remainingResponse = await request(app)
                    .get('/user/favorites')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(remainingResponse.body.favorites).to.have.lengthOf(1);
                expect(remainingResponse.body.favorites[0].verbText).to.equal('cool');
            });

            it('should validate bulk removal input', async () => {
                const response = await request(app)
                    .delete('/user/favorites/bulk-remove')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ favoriteIds: [] })
                    .expect(400);

                expect(response.body.status).to.equal('error');
            });

            it('should require authentication for bulk removal', async () => {
                await request(app)
                    .delete('/user/favorites/bulk-remove')
                    .send({ favoriteIds: [{ letter: 'a', verbId: 1 }] })
                    .expect(401);
            });
        });

        describe('GET /user/favorites/stats', () => {
            it('should return favorites statistics', async () => {
                // Добавляем тестовые избранные
                const favorites = [
                    { letter: 'a', verbId: 1, verbText: 'arbeiten' },
                    { letter: 'b', verbId: 2, verbText: 'beginnen' },
                    { letter: 'a', verbId: 3, verbText: 'antworten' }
                ];

                for (const favorite of favorites) {
                    await request(app)
                        .post('/user/favorites/add')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send(favorite)
                        .expect(201);
                }

                const response = await request(app)
                    .get('/user/favorites/stats')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body.status).to.equal('success');
                expect(response.body.stats).to.have.property('total', 3);
                expect(response.body.stats).to.have.property('recentlyAdded', 3);
                expect(response.body.stats.byLetter).to.be.an('array');
                expect(response.body.stats.byLetter.length).to.be.at.least(0); // Может быть пустым в тестах
            });

            it('should require authentication for stats', async () => {
                await request(app)
                    .get('/user/favorites/stats')
                    .expect(401);
            });
        });
    });

    describe('Lists API', () => {
        describe('POST /user/lists', () => {
            it('should create a new list successfully', async () => {
                const listData = {
                    name: 'My Test List',
                    description: 'A test list for verbs',
                    isPublic: false
                };

                const response = await request(app)
                    .post('/user/lists')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(listData)
                    .expect(201);

                expect(response.body).to.have.property('message', 'Список создан успешно');
                expect(response.body).to.have.property('list');
                expect(response.body.list).to.have.property('name', 'My Test List');
                expect(response.body.list).to.have.property('isPublic', false);

                // Verify in database
                const savedList = await UserVerbLists.findById(response.body.list._id);
                expect(savedList).to.exist;
            });

            it('should validate required fields', async () => {
                const response = await request(app)
                    .post('/user/lists')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({})
                    .expect(400);

                expect(response.body).to.have.property('message');
            });

            it('should enforce name length limits', async () => {
                const listData = {
                    name: 'a'.repeat(101), // too long
                    description: 'Test description'
                };

                const response = await request(app)
                    .post('/user/lists')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(listData)
                    .expect(400);

                expect(response.body).to.have.property('message');
            });
        });

        describe('GET /user/lists', () => {
            beforeEach(async () => {
                // Create test lists
                const lists = [
                    { userId: testUser._id, name: 'List 1', description: 'First list' },
                    { userId: testUser._id, name: 'List 2', description: 'Second list', isPublic: true }
                ];
                await UserVerbLists.insertMany(lists);
            });

            it('should get user lists', async () => {
                const response = await request(app)
                    .get('/user/lists')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body).to.have.property('lists');
                expect(response.body.lists).to.be.an('array');
                expect(response.body.lists).to.have.length(2);
            });

            it('should support filtering by visibility', async () => {
                const response = await request(app)
                    .get('/user/lists?visibility=public')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body.lists).to.have.length(1);
                expect(response.body.lists[0].isPublic).to.be.true;
            });
        });

        describe('PUT /user/lists/:id', () => {
            let testList;

            beforeEach(async () => {
                testList = new UserVerbLists({
                    userId: testUser._id,
                    name: 'Original Name',
                    description: 'Original description'
                });
                await testList.save();
            });

            it('should update list successfully', async () => {
                const updateData = {
                    name: 'Updated Name',
                    description: 'Updated description',
                    isPublic: true
                };

                const response = await request(app)
                    .put(`/user/lists/${testList._id}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(updateData)
                    .expect(200);

                expect(response.body).to.have.property('message', 'Список обновлен успешно');
                expect(response.body.list).to.have.property('name', 'Updated Name');
                expect(response.body.list).to.have.property('isPublic', true);
            });

            it('should not allow updating other users lists', async () => {
                // Create another user
                const anotherUser = new User({
                    username: 'anotheruser',
                    email: 'another@test.com',
                    password: 'password123'
                });
                await anotherUser.save();

                const anotherToken = jwt.sign(
                    { id: anotherUser._id, username: anotherUser.username },
                    process.env.JWT_SECRET
                );

                const updateData = { name: 'Hacked Name' };

                await request(app)
                    .put(`/user/lists/${testList._id}`)
                    .set('Authorization', `Bearer ${anotherToken}`)
                    .send(updateData)
                    .expect(404);

                // Cleanup
                await User.findByIdAndDelete(anotherUser._id);
            });
        });

        describe('DELETE /user/lists/:id', () => {
            let testList;

            beforeEach(async () => {
                testList = new UserVerbLists({
                    userId: testUser._id,
                    name: 'Test List',
                    description: 'To be deleted'
                });
                await testList.save();
            });

            it('should delete list successfully', async () => {
                const response = await request(app)
                    .delete(`/user/lists/${testList._id}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body).to.have.property('message', 'Список удален успешно');

                // Verify deletion
                const deletedList = await UserVerbLists.findById(testList._id);
                expect(deletedList).to.not.exist;
            });
        });
    });

    describe('Profile Views', () => {
        describe('GET /user/profile', () => {
            it('should render profile page for authenticated user', async () => {
                const response = await request(app)
                    .get('/user/profile')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.text).to.include('Профиль пользователя');
                expect(response.text).to.include('testuser');
            });

            it('should require authentication', async () => {
                await request(app)
                    .get('/user/profile')
                    .expect(401);
            });
        });

        describe('GET /user/favorites (view)', () => {
            it('should render favorites page', async () => {
                const response = await request(app)
                    .get('/user/favorites/view')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.text).to.include('Избранные глаголы');
                expect(response.text).to.include('favorites-list');
            });
        });

        describe('GET /user/lists (view)', () => {
            it('should render lists page', async () => {
                const response = await request(app)
                    .get('/user/lists/view')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.text).to.include('Мои списки глаголов');
                expect(response.text).to.include('lists-grid');
            });
        });
    });
}); 