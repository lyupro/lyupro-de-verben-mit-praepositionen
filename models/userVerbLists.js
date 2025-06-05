import mongoose from 'mongoose';

const UserVerbListsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware для автоматического обновления поля updatedAt
UserVerbListsSchema.pre('save', function(next) {
    if (!this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

UserVerbListsSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: Date.now() });
});

// Индекс для быстрого поиска по пользователю
UserVerbListsSchema.index({ userId: 1, createdAt: -1 });

const UserVerbLists = mongoose.model('UserVerbLists', UserVerbListsSchema);

export default UserVerbLists; 