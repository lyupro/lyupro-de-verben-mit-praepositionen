// models/user.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Имя пользователя обязательно'],
        unique: true,
        minlength: [3, 'Имя пользователя должно содержать минимум 3 символа'],
        maxlength: [30, 'Имя пользователя не должно превышать 30 символов']
    },
    email: {
        type: String,
        required: [true, 'Email обязателен'],
        unique: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Неверный формат email']
    },
    password: {
        type: String,
        required: [true, 'Пароль обязателен'],
        minlength: [6, 'Пароль должен содержать минимум 6 символов']
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

// Middleware для хеширования пароля перед сохранением
UserSchema.pre('save', async function(next) {
    // Обновляем updatedAt если это не новый документ
    if (!this.isNew) {
        this.updatedAt = Date.now();
    }
    
    // Хешируем пароль только если он был изменен
    if (this.isModified('password')) {
        try {
            const saltRounds = 10;
            this.password = await bcrypt.hash(this.password, saltRounds);
        } catch (error) {
            return next(error);
        }
    }
    
    next();
});

// Middleware для автоматического обновления поля updatedAt при обновлении документа
UserSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: Date.now() });
});

// Метод для сравнения паролей
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

export default User;