import mongoose from 'mongoose';

const UserVerbListItemsSchema = new mongoose.Schema({
    listId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserVerbLists',
        required: true
    },
    letter: {
        type: String,
        required: true,
        lowercase: true,
        match: /^[a-z]{1,2}$/
    },
    verbId: {
        type: Number,
        required: true
    },
    verbText: {
        type: String,
        required: true,
        lowercase: true
    },
    order: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 200
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

// Составной индекс для уникальности комбинации список-глагол
UserVerbListItemsSchema.index({ listId: 1, letter: 1, verbId: 1 }, { unique: true });

// Индекс для быстрого поиска по списку с сортировкой по порядку
UserVerbListItemsSchema.index({ listId: 1, order: 1, addedAt: 1 });

const UserVerbListItems = mongoose.model('UserVerbListItems', UserVerbListItemsSchema);

export default UserVerbListItems; 