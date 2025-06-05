document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Добавляем состояние загрузки
        form.classList.add('loading');
        const submitBtn = form.querySelector('.btn-auth');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Входим...';

        // Скрываем предыдущие сообщения
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';

        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Сохраняем токен в localStorage
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                successDiv.textContent = 'Вход выполнен успешно! Перенаправляем...';
                successDiv.style.display = 'block';
                
                // Перенаправляем через 1 секунду
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                // Показываем ошибку
                errorDiv.textContent = result.message || 'Ошибка входа. Проверьте данные.';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Произошла ошибка при входе. Попробуйте позже.';
            errorDiv.style.display = 'block';
        } finally {
            // Убираем состояние загрузки
            form.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Войти';
        }
    });
}); 