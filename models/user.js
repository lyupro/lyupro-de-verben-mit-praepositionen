// models/user.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'helper', 'moderator', 'administrator'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true // Это поле нельзя будет изменить после создания
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Middleware для автоматического обновления поля updatedAt перед сохранением
UserSchema.pre('save', function(next) {
    if (!this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

// Middleware для автоматического обновления поля updatedAt при обновлении документа
UserSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: Date.now() });
});

const User = mongoose.model('User', UserSchema);

export default User;