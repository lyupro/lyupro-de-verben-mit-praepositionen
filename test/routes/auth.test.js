import { expect } from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, initTestDatabase } from '../setup/testServer.js';
import User from '../../models/user.js';

describe('Authentication API', () => {
    let app;

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

    afterEach(async () => {
        // Очищаем пользователей после каждого теста
        await User.deleteMany({ email: { $regex: /test.*@test\.com/ } });
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@test.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body).to.have.property('message', 'Пользователь успешно зарегистрирован');
            expect(response.body).to.have.property('user');
            expect(response.body.user).to.have.property('username', 'testuser');
            expect(response.body.user).to.have.property('email', 'test@test.com');
            expect(response.body.user).to.have.property('role', 'user');
            expect(response.body.user).to.not.have.property('password'); // password should not be returned

            // Verify user was created in database
            const savedUser = await User.findOne({ email: 'test@test.com' });
            expect(savedUser).to.exist;
            expect(savedUser.username).to.equal('testuser');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({})
                .expect(400);

            expect(response.body).to.have.property('errors');
            expect(response.body.errors).to.be.an('array');
            expect(response.body.errors.some(err => err.includes('Имя пользователя'))).to.be.true;
            expect(response.body.errors.some(err => err.includes('Email'))).to.be.true;
            expect(response.body.errors.some(err => err.includes('Пароль'))).to.be.true;
        });

        it('should validate email format', async () => {
            const userData = {
                username: 'testuser',
                email: 'invalid-email',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.errors.some(err => err.includes('Email'))).to.be.true;
        });

        it('should validate username length', async () => {
            const userData = {
                username: 'ab', // too short
                email: 'test@test.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.errors.some(err => err.includes('Имя пользователя'))).to.be.true;
        });

        it('should validate password length', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@test.com',
                password: '123' // too short
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.errors.some(err => err.includes('Пароль'))).to.be.true;
        });

        it('should not allow duplicate email', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@test.com',
                password: 'password123'
            };

            // Register first user
            await request(app)
                .post('/auth/register')
                .send(userData)
                .expect(201);

            // Try to register second user with same email
            const duplicateData = {
                username: 'anotheruser',
                email: 'test@test.com', // same email
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(duplicateData)
                .expect(400);

            expect(response.body).to.have.property('message');
            expect(response.body.message).to.include('уже существует');
        });

        it('should not allow duplicate username', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@test.com',
                password: 'password123'
            };

            // Register first user
            await request(app)
                .post('/auth/register')
                .send(userData)
                .expect(201);

            // Try to register second user with same username
            const duplicateData = {
                username: 'testuser', // same username
                email: 'another@test.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(duplicateData)
                .expect(400);

            expect(response.body).to.have.property('message');
            expect(response.body.message).to.include('уже существует');
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            // Create a test user for login tests
            const testUser = new User({
                username: 'testuser',
                email: 'test@test.com',
                password: 'password123'
            });
            await testUser.save();
        });

        it('should login successfully with valid credentials', async () => {
            const loginData = {
                email: 'test@test.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body).to.have.property('message', 'Вход выполнен успешно');
            expect(response.body).to.have.property('token');
            expect(response.body).to.have.property('user');
            expect(response.body.user).to.have.property('username', 'testuser');
            expect(response.body.user).to.have.property('email', 'test@test.com');
            expect(response.body.user).to.not.have.property('password'); // password should not be returned

            // Verify JWT token format
            expect(response.body.token).to.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
        });

        it('should reject login with invalid email', async () => {
            const loginData = {
                email: 'nonexistent@test.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body).to.have.property('message', 'Неверный email или пароль');
        });

        it('should reject login with invalid password', async () => {
            const loginData = {
                email: 'test@test.com',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body).to.have.property('message', 'Неверный email или пароль');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({})
                .expect(400);

            expect(response.body).to.have.property('errors');
            expect(response.body.errors).to.be.an('array');
            expect(response.body.errors.some(err => err.includes('Email'))).to.be.true;
            expect(response.body.errors.some(err => err.includes('Пароль'))).to.be.true;
        });

        it('should validate email format', async () => {
            const loginData = {
                email: 'invalid-email',
                password: 'password123'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(400);

            expect(response.body.errors.some(err => err.includes('Email'))).to.be.true;
        });
    });

    describe('GET /auth/login (view)', () => {
        it('should render login page', async () => {
            const response = await request(app)
                .get('/auth/login')
                .expect(200);

            expect(response.text).to.include('Вход в систему');
            expect(response.text).to.include('auth-form');
        });
    });

    describe('GET /auth/register (view)', () => {
        it('should render register page', async () => {
            const response = await request(app)
                .get('/auth/register')
                .expect(200);

            expect(response.text).to.include('Регистрация');
            expect(response.text).to.include('auth-form');
        });
    });
}); 