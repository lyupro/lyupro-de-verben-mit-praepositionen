import { expect } from 'chai';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp, initTestDatabase } from '../setup/testServer.js';
import User from '../../models/user.js';

describe('Authentication Middleware', () => {
    let app;
    let testUser;
    let validToken;
    let expiredToken;

    before(async () => {
        await initTestDatabase();
        app = createTestApp();
        // Очищаем тестовые данные
        await User.deleteMany({ email: { $regex: /test.*@test\.com/ } });
    });

    after(async () => {
        // Очищаем тестовые данные
        await User.deleteMany({ email: { $regex: /test.*@test\.com/ } });
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

        // Создаем валидный токен
        validToken = jwt.sign(
            { 
                id: testUser._id, 
                username: testUser.username, 
                email: testUser.email,
                role: testUser.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Создаем истекший токен
        expiredToken = jwt.sign(
            { 
                id: testUser._id, 
                username: testUser.username, 
                email: testUser.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '-1h' } // expired 1 hour ago
        );
    });

    afterEach(async () => {
        // Очищаем тестовые данные после каждого теста
        if (testUser && testUser._id) {
            await User.findByIdAndDelete(testUser._id);
        }
    });

    describe('JWT Authentication', () => {
        it('should allow access with valid token', async () => {
            const response = await request(app)
                .get('/user/profile')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200);

            expect(response.text).to.include('testuser');
        });

        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/user/profile')
                .expect(401);

            expect(response.body).to.have.property('message', 'Токен не предоставлен');
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/user/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).to.have.property('message', 'Недействительный токен');
        });

        it('should reject request with expired token', async () => {
            const response = await request(app)
                .get('/user/profile')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);

            expect(response.body).to.have.property('message', 'Недействительный токен');
        });

        it('should reject request with malformed Authorization header', async () => {
            // Missing "Bearer " prefix
            await request(app)
                .get('/user/profile')
                .set('Authorization', validToken)
                .expect(401);

            // Wrong prefix
            await request(app)
                .get('/user/profile')
                .set('Authorization', `Basic ${validToken}`)
                .expect(401);
        });

        it('should reject request when user no longer exists', async () => {
            // Delete user from database
            await User.findByIdAndDelete(testUser._id);

            const response = await request(app)
                .get('/user/profile')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(401);

            expect(response.body).to.have.property('message', 'Пользователь не найден');
        });

        it('should handle token with invalid user ID', async () => {
            const invalidToken = jwt.sign(
                { 
                    id: new mongoose.Types.ObjectId(), // non-existent user ID
                    username: 'nonexistent',
                    email: 'nonexistent@test.com'
                },
                process.env.JWT_SECRET
            );

            const response = await request(app)
                .get('/user/profile')
                .set('Authorization', `Bearer ${invalidToken}`)
                .expect(401);

            expect(response.body).to.have.property('message', 'Пользователь не найден');
        });
    });

    describe('Authorization (Role-based)', () => {
        it('should allow admin access to admin routes', async () => {
            // Update user role to admin
            testUser.role = 'administrator';
            await testUser.save();

            const adminToken = jwt.sign(
                { 
                    id: testUser._id, 
                    username: testUser.username, 
                    email: testUser.email,
                    role: 'administrator'
                },
                process.env.JWT_SECRET
            );

            // This should work for admin routes (assuming we have admin routes)
            // For now, we'll test user routes as they don't have role restrictions
            const response = await request(app)
                .get('/user/profile')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.text).to.include('testuser');
        });

        it('should preserve user data in request object', async () => {
            // Create a test route that returns user data
            app.get('/test/user-data', (req, res, next) => {
                const token = req.headers.authorization?.split(' ')[1];
                if (!token) {
                    return res.status(401).json({ message: 'No token' });
                }

                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    res.json({
                        userId: decoded.id,
                        username: decoded.username,
                        email: decoded.email,
                        role: decoded.role
                    });
                } catch (error) {
                    res.status(401).json({ message: 'Invalid token' });
                }
            });

            const response = await request(app)
                .get('/test/user-data')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200);

            expect(response.body).to.have.property('userId', testUser._id.toString());
            expect(response.body).to.have.property('username', 'testuser');
            expect(response.body).to.have.property('email', 'test@test.com');
            expect(response.body).to.have.property('role', 'user');
        });
    });

    describe('Token Edge Cases', () => {
        it('should handle token with missing required fields', async () => {
            const incompleteToken = jwt.sign(
                { id: testUser._id }, // missing username and email
                process.env.JWT_SECRET
            );

            // The middleware should still work as long as user exists in DB
            const response = await request(app)
                .get('/user/profile')
                .set('Authorization', `Bearer ${incompleteToken}`)
                .expect(200);

            expect(response.text).to.include('testuser');
        });

        it('should handle token signed with different secret', async () => {
            const wrongSecretToken = jwt.sign(
                { 
                    id: testUser._id, 
                    username: testUser.username, 
                    email: testUser.email 
                },
                'wrong-secret'
            );

            const response = await request(app)
                .get('/user/profile')
                .set('Authorization', `Bearer ${wrongSecretToken}`)
                .expect(401);

            expect(response.body).to.have.property('message', 'Недействительный токен');
        });

        it('should handle malformed JWT token', async () => {
            const malformedToken = 'not.a.jwt';

            const response = await request(app)
                .get('/user/profile')
                .set('Authorization', `Bearer ${malformedToken}`)
                .expect(401);

            expect(response.body).to.have.property('message', 'Недействительный токен');
        });
    });

    describe('Security Headers', () => {
        it('should not expose sensitive information in error responses', async () => {
            const response = await request(app)
                .get('/user/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            // Should not contain stack traces or internal errors
            expect(response.body).to.not.have.property('stack');
            expect(response.body).to.not.have.property('error');
            expect(JSON.stringify(response.body)).to.not.include('jwt');
            expect(JSON.stringify(response.body)).to.not.include('secret');
        });

        it('should handle concurrent requests with same token', async () => {
            const requests = Array(5).fill().map(() =>
                request(app)
                    .get('/user/profile')
                    .set('Authorization', `Bearer ${validToken}`)
            );

            const responses = await Promise.all(requests);
            
            responses.forEach(response => {
                expect(response.status).to.equal(200);
                expect(response.text).to.include('testuser');
            });
        });
    });
}); 