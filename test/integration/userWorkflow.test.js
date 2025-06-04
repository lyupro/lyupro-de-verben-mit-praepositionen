// test/integration/userWorkflow.test.js
import { expect } from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, initTestDatabase } from '../setup/testServer.js';
import User from '../../models/user.js';
import UserFavorites from '../../models/userFavorites.js';
import UserVerbLists from '../../models/userVerbLists.js';
import UserVerbListItems from '../../models/userVerbListItems.js';

describe('User Workflow Integration Tests', () => {
    let app;
    let authToken;
    let userId;
    let listId;

    before(async () => {
        await initTestDatabase();
        app = createTestApp();
        // Очищаем все тестовые данные
        await User.deleteMany({ email: { $regex: /test.*@test\.com/ } });
        await UserFavorites.deleteMany({});
        await UserVerbLists.deleteMany({});
        await UserVerbListItems.deleteMany({});
    });

    after(async () => {
        // Очищаем все тестовые данные
        await User.deleteMany({ email: { $regex: /test.*@test\.com/ } });
        await UserFavorites.deleteMany({});
        await UserVerbLists.deleteMany({});
        await UserVerbListItems.deleteMany({});
        await mongoose.connection.close();
    });

    describe('Complete User Journey', () => {
        it('should complete full user registration and authentication flow', async () => {
            // 1. Register new user
            const userData = {
                username: 'integrationuser',
                email: 'integration@test.com',
                password: 'password123'
            };

            const registerResponse = await request(app)
                .post('/auth/register')
                .send(userData)
                .expect(201);

            expect(registerResponse.body).to.have.property('message', 'Пользователь успешно зарегистрирован');
            expect(registerResponse.body.user).to.have.property('username', 'integrationuser');
            userId = registerResponse.body.user._id;

            // 2. Login with new user
            const loginResponse = await request(app)
                .post('/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password
                })
                .expect(200);

            expect(loginResponse.body).to.have.property('token');
            authToken = loginResponse.body.token;

            // 3. Access profile page
            const profileResponse = await request(app)
                .get('/user/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(profileResponse.text).to.include('integrationuser');
        });

        it('should complete full favorites workflow', async () => {
            // 1. Add verb to favorites
            const favoriteData = {
                letter: 'a',
                verbId: 1,
                verbText: 'arbeiten'
            };

            const addResponse = await request(app)
                .post('/user/favorites/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send(favoriteData)
                .expect(201);

            expect(addResponse.body).to.have.property('message', 'Глагол добавлен в избранное');

            // 2. Check if verb is in favorites
            const checkResponse = await request(app)
                .get('/user/favorites/check?letter=a&verbId=1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(checkResponse.body).to.have.property('isFavorite', true);

            // 3. Get favorites list
            const favoritesResponse = await request(app)
                .get('/user/favorites')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(favoritesResponse.body.favorites).to.have.length(1);
            expect(favoritesResponse.body.favorites[0]).to.have.property('verbText', 'arbeiten');

            // 4. Add more favorites
            await request(app)
                .post('/user/favorites/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ letter: 'b', verbId: 2, verbText: 'beginnen' })
                .expect(201);

            await request(app)
                .post('/user/favorites/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ letter: 'c', verbId: 3, verbText: 'können' })
                .expect(201);

            // 5. Test pagination
            const paginatedResponse = await request(app)
                .get('/user/favorites?page=1&limit=2')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(paginatedResponse.body.favorites).to.have.length(2);
            expect(paginatedResponse.body.pagination).to.have.property('totalFavorites', 3);

            // 6. Test search
            const searchResponse = await request(app)
                .get('/user/favorites?search=arbeit')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(searchResponse.body.favorites).to.have.length(1);
            expect(searchResponse.body.favorites[0].verbText).to.equal('arbeiten');

            // 7. Remove from favorites
            const removeResponse = await request(app)
                .delete('/user/favorites/remove')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ letter: 'a', verbId: 1 })
                .expect(200);

            expect(removeResponse.body).to.have.property('message', 'Глагол удален из избранного');

            // 8. Verify removal
            const verifyResponse = await request(app)
                .get('/user/favorites/check?letter=a&verbId=1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(verifyResponse.body).to.have.property('isFavorite', false);
        });

        it('should complete full verb lists workflow', async () => {
            // 1. Create new list
            const listData = {
                name: 'Integration Test List',
                description: 'A list for integration testing',
                isPublic: false
            };

            const createResponse = await request(app)
                .post('/user/lists')
                .set('Authorization', `Bearer ${authToken}`)
                .send(listData)
                .expect(201);

            expect(createResponse.body).to.have.property('message', 'Список создан успешно');
            expect(createResponse.body.list).to.have.property('name', 'Integration Test List');
            listId = createResponse.body.list._id;

            // 2. Get user lists
            const listsResponse = await request(app)
                .get('/user/lists')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(listsResponse.body.lists).to.have.length(1);
            expect(listsResponse.body.lists[0]).to.have.property('name', 'Integration Test List');

            // 3. Add verbs to list
            const verbData1 = { letter: 'a', verbId: 1, verbText: 'arbeiten' };
            const verbData2 = { letter: 'b', verbId: 2, verbText: 'beginnen' };

            await request(app)
                .post(`/user/lists/${listId}/verbs`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(verbData1)
                .expect(201);

            await request(app)
                .post(`/user/lists/${listId}/verbs`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(verbData2)
                .expect(201);

            // 4. Get list details with verbs
            const listDetailResponse = await request(app)
                .get(`/user/lists/${listId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(listDetailResponse.body.list).to.have.property('name', 'Integration Test List');
            expect(listDetailResponse.body.verbs).to.have.length(2);

            // 5. Update list
            const updateData = {
                name: 'Updated Integration List',
                description: 'Updated description',
                isPublic: true
            };

            const updateResponse = await request(app)
                .put(`/user/lists/${listId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(updateResponse.body.list).to.have.property('name', 'Updated Integration List');
            expect(updateResponse.body.list).to.have.property('isPublic', true);

            // 6. Remove verb from list
            const verbToRemove = await UserVerbListItems.findOne({ listId, verbText: 'arbeiten' });
            
            await request(app)
                .delete(`/user/lists/${listId}/verbs/${verbToRemove._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // 7. Verify verb removal
            const updatedListResponse = await request(app)
                .get(`/user/lists/${listId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(updatedListResponse.body.verbs).to.have.length(1);
            expect(updatedListResponse.body.verbs[0]).to.have.property('verbText', 'beginnen');

            // 8. Test list filtering
            const publicListsResponse = await request(app)
                .get('/user/lists?visibility=public')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(publicListsResponse.body.lists).to.have.length(1);
            expect(publicListsResponse.body.lists[0].isPublic).to.be.true;

            // 9. Delete list
            const deleteResponse = await request(app)
                .delete(`/user/lists/${listId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(deleteResponse.body).to.have.property('message', 'Список удален успешно');

            // 10. Verify list deletion
            const finalListsResponse = await request(app)
                .get('/user/lists')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(finalListsResponse.body.lists).to.have.length(0);
        });

        it('should handle concurrent operations correctly', async () => {
            // Test concurrent favorite additions
            const favoritePromises = [
                { letter: 'a', verbId: 10, verbText: 'anfangen' },
                { letter: 'b', verbId: 11, verbText: 'bleiben' },
                { letter: 'c', verbId: 12, verbText: 'denken' },
                { letter: 'd', verbId: 13, verbText: 'essen' },
                { letter: 'f', verbId: 14, verbText: 'fahren' }
            ].map(favoriteData =>
                request(app)
                    .post('/user/favorites/add')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(favoriteData)
            );

            const responses = await Promise.all(favoritePromises);
            
            // All should succeed
            responses.forEach(response => {
                expect(response.status).to.equal(201);
            });

            // Verify all favorites were added
            const favoritesResponse = await request(app)
                .get('/user/favorites')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(favoritesResponse.body.favorites).to.have.length(5);
        });

        it('should handle error scenarios gracefully', async () => {
            // 1. Try to add duplicate favorite
            const favoriteData = { letter: 'a', verbId: 10, verbText: 'anfangen' };
            
            await request(app)
                .post('/user/favorites/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send(favoriteData)
                .expect(400); // Should fail as it already exists

            // 2. Try to remove non-existent favorite
            await request(app)
                .delete('/user/favorites/remove')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ letter: 'z', verbId: 999 })
                .expect(404);

            // 3. Try to access non-existent list
            const fakeListId = new mongoose.Types.ObjectId();
            await request(app)
                .get(`/user/lists/${fakeListId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            // 4. Try to update non-existent list
            await request(app)
                .put(`/user/lists/${fakeListId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'New Name' })
                .expect(404);

            // 5. Try to create list with invalid data
            await request(app)
                .post('/user/lists')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: '' }) // Empty name
                .expect(400);
        });

        it('should maintain data consistency across operations', async () => {
            // Create multiple lists and favorites
            const list1Response = await request(app)
                .post('/user/lists')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'List 1', description: 'First list' })
                .expect(201);

            const list2Response = await request(app)
                .post('/user/lists')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'List 2', description: 'Second list' })
                .expect(201);

            const list1Id = list1Response.body.list._id;
            const list2Id = list2Response.body.list._id;

            // Add same verb to both lists and favorites
            const verbData = { letter: 'z', verbId: 100, verbText: 'zusammen' };

            await request(app)
                .post('/user/favorites/add')
                .set('Authorization', `Bearer ${authToken}`)
                .send(verbData)
                .expect(201);

            await request(app)
                .post(`/user/lists/${list1Id}/verbs`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(verbData)
                .expect(201);

            await request(app)
                .post(`/user/lists/${list2Id}/verbs`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(verbData)
                .expect(201);

            // Verify verb appears in all places
            const favoritesResponse = await request(app)
                .get('/user/favorites?search=zusammen')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(favoritesResponse.body.favorites).to.have.length(1);

            const list1Response2 = await request(app)
                .get(`/user/lists/${list1Id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(list1Response2.body.verbs).to.have.length(1);
            expect(list1Response2.body.verbs[0].verbText).to.equal('zusammen');

            const list2Response2 = await request(app)
                .get(`/user/lists/${list2Id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(list2Response2.body.verbs).to.have.length(1);
            expect(list2Response2.body.verbs[0].verbText).to.equal('zusammen');

            // Remove from favorites - should not affect lists
            await request(app)
                .delete('/user/favorites/remove')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ letter: 'z', verbId: 100 })
                .expect(200);

            // Verify still in lists but not in favorites
            const checkFavoriteResponse = await request(app)
                .get('/user/favorites/check?letter=z&verbId=100')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(checkFavoriteResponse.body.isFavorite).to.be.false;

            // Lists should still have the verb
            const finalList1Response = await request(app)
                .get(`/user/lists/${list1Id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(finalList1Response.body.verbs).to.have.length(1);
        });
    });
}); 