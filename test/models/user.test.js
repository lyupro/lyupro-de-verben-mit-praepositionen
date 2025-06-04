import { expect } from 'chai';
import mongoose from 'mongoose';
import { connectToDatabase } from '../../db.js';
import User from '../../models/user.js';

describe('User Model', () => {
    let testUser;

    before(async () => {
        await connectToDatabase();
        // Очищаем тестовые данные перед началом
        await User.deleteMany({ email: { $regex: /test.*@test\.com/ } });
    });

    after(async () => {
        // Очищаем тестовые данные после окончания
        await User.deleteMany({ email: { $regex: /test.*@test\.com/ } });
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Создаем нового тестового пользователя для каждого теста
        testUser = new User({
            username: 'testuser',
            email: 'test@test.com',
            password: 'password123'
        });
    });

    afterEach(async () => {
        // Удаляем тестового пользователя после каждого теста
        if (testUser && testUser._id) {
            await User.findByIdAndDelete(testUser._id);
        }
    });

    describe('Schema Validation', () => {
        it('should create a valid user', async () => {
            const savedUser = await testUser.save();
            expect(savedUser._id).to.exist;
            expect(savedUser.username).to.equal('testuser');
            expect(savedUser.email).to.equal('test@test.com');
            expect(savedUser.role).to.equal('user'); // default role
        });

        it('should require username', async () => {
            testUser.username = undefined;
            try {
                await testUser.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.errors.username).to.exist;
            }
        });

        it('should require email', async () => {
            testUser.email = undefined;
            try {
                await testUser.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.errors.email).to.exist;
            }
        });

        it('should require password', async () => {
            testUser.password = undefined;
            try {
                await testUser.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.errors.password).to.exist;
            }
        });

        it('should validate email format', async () => {
            testUser.email = 'invalid-email';
            try {
                await testUser.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.errors.email).to.exist;
            }
        });

        it('should validate username length', async () => {
            testUser.username = 'a'; // too short
            try {
                await testUser.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.errors.username).to.exist;
            }
        });

        it('should validate password length', async () => {
            testUser.password = '123'; // too short
            try {
                await testUser.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.errors.password).to.exist;
            }
        });

        it('should validate role enum', async () => {
            testUser.role = 'invalid_role';
            try {
                await testUser.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.errors.role).to.exist;
            }
        });
    });

    describe('Password Hashing', () => {
        it('should hash password before saving', async () => {
            const plainPassword = testUser.password;
            const savedUser = await testUser.save();
            expect(savedUser.password).to.not.equal(plainPassword);
            expect(savedUser.password).to.include('$2b$'); // bcrypt hash starts with this
        });

        it('should not rehash password if not modified', async () => {
            const savedUser = await testUser.save();
            const originalHash = savedUser.password;
            
            savedUser.username = 'updatedusername';
            await savedUser.save();
            
            expect(savedUser.password).to.equal(originalHash);
        });
    });

    describe('Unique Constraints', () => {
        it('should enforce unique email', async () => {
            await testUser.save();
            
            const duplicateUser = new User({
                username: 'anotheruser',
                email: 'test@test.com', // same email
                password: 'password123'
            });

            try {
                await duplicateUser.save();
                expect.fail('Should have thrown duplicate key error');
            } catch (error) {
                expect(error.code).to.equal(11000); // MongoDB duplicate key error
            }
        });

        it('should enforce unique username', async () => {
            await testUser.save();
            
            const duplicateUser = new User({
                username: 'testuser', // same username
                email: 'another@test.com',
                password: 'password123'
            });

            try {
                await duplicateUser.save();
                expect.fail('Should have thrown duplicate key error');
            } catch (error) {
                expect(error.code).to.equal(11000); // MongoDB duplicate key error
            }
        });
    });

    describe('Default Values', () => {
        it('should set default role to "user"', async () => {
            const savedUser = await testUser.save();
            expect(savedUser.role).to.equal('user');
        });

        it('should set createdAt timestamp', async () => {
            const savedUser = await testUser.save();
            expect(savedUser.createdAt).to.be.a('date');
            expect(savedUser.createdAt).to.be.closeTo(new Date(), 1000); // within 1 second
        });
    });
}); 