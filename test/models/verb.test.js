// test/models/verb.test.js
import { expect } from 'chai';
import mongoose from 'mongoose';
import { connectToDatabase } from '../../db.js';
import { createModels, getVerbModel } from '../../models/verb.js';

describe('Verb Model', () => {
    before(async () => {
        await connectToDatabase();
        createModels();
    });

    after(async () => {
        await mongoose.connection.close();
    });

    describe('getVerbModel', () => {
        it('should return a model for a valid letter', () => {
            const model = getVerbModel('a');
            expect(model).to.be.an('function');
            expect(model.modelName).to.include('Verb_a');
        });

        it('should throw an error for an invalid letter', () => {
            expect(() => getVerbModel('1')).to.throw('Модель глагола для буквы "1" не найдена.');
        });
    });
});