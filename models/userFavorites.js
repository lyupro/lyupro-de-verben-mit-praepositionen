import mongoose from 'mongoose';

const UserFavoritesSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    addedAt: {
        type: Date,
        default: Date.now
    }
});

// Составной индекс для уникальности комбинации пользователь-глагол
UserFavoritesSchema.index({ userId: 1, letter: 1, verbId: 1 }, { unique: true });

// Индекс для быстрого поиска по пользователю
UserFavoritesSchema.index({ userId: 1, addedAt: -1 });

const UserFavorites = mongoose.model('UserFavorites', UserFavoritesSchema);

export default UserFavorites; 