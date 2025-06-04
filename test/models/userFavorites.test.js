import { expect } from 'chai';
import mongoose from 'mongoose';
import { connectToDatabase } from '../../db.js';
import User from '../../models/user.js';
import UserFavorites from '../../models/userFavorites.js';

describe('UserFavorites Model', () => {
    let testUser;
    let testFavorite;

    before(async () => {
        await connectToDatabase();
        // Очищаем тестовые данные
        await User.deleteMany({ email: { $regex: /test.*@test\.com/ } });
        await UserFavorites.deleteMany({});
    });

    after(async () => {
        // Очищаем тестовые данные
        await User.deleteMany({ email: { $regex: /test.*@test\.com/ } });
        await UserFavorites.deleteMany({});
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

        // Создаем тестовое избранное
        testFavorite = new UserFavorites({
            userId: testUser._id,
            letter: 'a',
            verbId: 1,
            verbText: 'arbeiten'
        });
    });

    afterEach(async () => {
        // Очищаем тестовые данные
        await UserFavorites.deleteMany({});
        if (testUser && testUser._id) {
            await User.findByIdAndDelete(testUser._id);
        }
    });

    describe('Schema Validation', () => {
        it('should create a valid favorite', async () => {
            const savedFavorite = await testFavorite.save();
            expect(savedFavorite._id).to.exist;
            expect(savedFavorite.userId.toString()).to.equal(testUser._id.toString());
            expect(savedFavorite.letter).to.equal('a');
            expect(savedFavorite.verbId).to.equal(1);
            expect(savedFavorite.verbText).to.equal('arbeiten');
            expect(savedFavorite.addedAt).to.be.a('date');
        });

        it('should require userId', async () => {
            testFavorite.userId = undefined;
            try {
                await testFavorite.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.errors.userId).to.exist;
            }
        });

        it('should require letter', async () => {
            testFavorite.letter = undefined;
            try {
                await testFavorite.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.errors.letter).to.exist;
            }
        });

        it('should require verbId', async () => {
            testFavorite.verbId = undefined;
            try {
                await testFavorite.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.errors.verbId).to.exist;
            }
        });

        it('should require verbText', async () => {
            testFavorite.verbText = undefined;
            try {
                await testFavorite.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.errors.verbText).to.exist;
            }
        });

        it('should validate letter format', async () => {
            testFavorite.letter = '123'; // invalid format
            try {
                await testFavorite.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.errors.letter).to.exist;
            }
        });

        it('should accept valid letter formats', async () => {
            // Single letter
            testFavorite.letter = 'a';
            let savedFavorite = await testFavorite.save();
            expect(savedFavorite.letter).to.equal('a');

            // Two letters (like 'ch', 'sch')
            await UserFavorites.findByIdAndDelete(savedFavorite._id);
            testFavorite.letter = 'ch';
            testFavorite.verbId = 2; // Change to avoid unique constraint
            savedFavorite = await testFavorite.save();
            expect(savedFavorite.letter).to.equal('ch');
        });

        it('should convert letter to lowercase', async () => {
            testFavorite.letter = 'A';
            const savedFavorite = await testFavorite.save();
            expect(savedFavorite.letter).to.equal('a');
        });

        it('should convert verbText to lowercase', async () => {
            testFavorite.verbText = 'ARBEITEN';
            const savedFavorite = await testFavorite.save();
            expect(savedFavorite.verbText).to.equal('arbeiten');
        });
    });

    describe('Unique Constraints', () => {
        it('should enforce unique combination of userId, letter, and verbId', async () => {
            await testFavorite.save();

            const duplicateFavorite = new UserFavorites({
                userId: testUser._id,
                letter: 'a',
                verbId: 1, // same combination
                verbText: 'arbeiten'
            });

            try {
                await duplicateFavorite.save();
                expect.fail('Should have thrown duplicate key error');
            } catch (error) {
                expect(error.code).to.equal(11000); // MongoDB duplicate key error
            }
        });

        it('should allow same verb for different users', async () => {
            await testFavorite.save();

            // Create another user
            const anotherUser = new User({
                username: 'anotheruser',
                email: 'another@test.com',
                password: 'password123'
            });
            await anotherUser.save();

            const anotherFavorite = new UserFavorites({
                userId: anotherUser._id,
                letter: 'a',
                verbId: 1, // same verb, different user
                verbText: 'arbeiten'
            });

            const savedFavorite = await anotherFavorite.save();
            expect(savedFavorite._id).to.exist;

            // Cleanup
            await User.findByIdAndDelete(anotherUser._id);
        });

        it('should allow different verbs for same user', async () => {
            await testFavorite.save();

            const anotherFavorite = new UserFavorites({
                userId: testUser._id,
                letter: 'b',
                verbId: 2, // different verb
                verbText: 'beginnen'
            });

            const savedFavorite = await anotherFavorite.save();
            expect(savedFavorite._id).to.exist;
        });
    });

    describe('Default Values', () => {
        it('should set addedAt timestamp', async () => {
            const savedFavorite = await testFavorite.save();
            expect(savedFavorite.addedAt).to.be.a('date');
            expect(savedFavorite.addedAt).to.be.closeTo(new Date(), 1000); // within 1 second
        });
    });

    describe('User Reference', () => {
        it('should populate user information', async () => {
            const savedFavorite = await testFavorite.save();
            const populatedFavorite = await UserFavorites.findById(savedFavorite._id).populate('userId');
            
            expect(populatedFavorite.userId.username).to.equal('testuser');
            expect(populatedFavorite.userId.email).to.equal('test@test.com');
        });
    });
}); 