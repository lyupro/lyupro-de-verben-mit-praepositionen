// utils/auth/validation.js
export const validateUser = ({ username, email, password }) => {
    const errors = [];

    if (!username || username.length < 3) {
        errors.push('Имя пользователя должно содержать минимум 3 символа');
    }

    if (!email || !email.includes('@')) {
        errors.push('Email должен быть в правильном формате');
    }

    if (!password || password.length < 6) {
        errors.push('Пароль должен содержать минимум 6 символов');
    }

    return errors;
};

export const sanitizeUser = (user) => {
    const { password, __v, ...sanitizedUser } = user.toObject();
    return sanitizedUser;
};