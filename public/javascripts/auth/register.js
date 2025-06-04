document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('register-form');
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Валидация совпадения паролей
    function validatePasswords() {
        if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity('Пароли не совпадают');
            confirmPasswordInput.classList.add('error');
        } else {
            confirmPasswordInput.setCustomValidity('');
            confirmPasswordInput.classList.remove('error');
        }
    }

    confirmPasswordInput.addEventListener('input', validatePasswords);
    passwordInput.addEventListener('input', validatePasswords);

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Проверяем совпадение паролей
        if (passwordInput.value !== confirmPasswordInput.value) {
            errorDiv.textContent = 'Пароли не совпадают';
            errorDiv.style.display = 'block';
            return;
        }

        // Добавляем состояние загрузки
        form.classList.add('loading');
        const submitBtn = form.querySelector('.btn-auth');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Регистрируем...';

        // Скрываем предыдущие сообщения
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';

        const formData = new FormData(form);
        const data = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                successDiv.textContent = 'Регистрация прошла успешно! Теперь вы можете войти в систему.';
                successDiv.style.display = 'block';
                
                // Очищаем форму
                form.reset();
                
                // Перенаправляем на страницу входа через 2 секунды
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 2000);
            } else {
                // Показываем ошибки
                if (result.errors && Array.isArray(result.errors)) {
                    errorDiv.textContent = result.errors.join(', ');
                } else {
                    errorDiv.textContent = result.message || 'Ошибка регистрации';
                }
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Registration error:', error);
            errorDiv.textContent = 'Произошла ошибка при регистрации. Попробуйте позже.';
            errorDiv.style.display = 'block';
        } finally {
            // Убираем состояние загрузки
            form.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Зарегистрироваться';
        }
    });
}); 