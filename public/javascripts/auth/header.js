document.addEventListener('DOMContentLoaded', function() {
    const userInfo = document.getElementById('user-info');
    const guestInfo = document.getElementById('guest-info');
    const usernameSpan = document.getElementById('username');
    const logoutBtn = document.getElementById('logout-btn');

    // Проверяем наличие токена и пользователя в localStorage
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        try {
            const userData = JSON.parse(user);
            // Показываем информацию о пользователе
            usernameSpan.textContent = userData.username;
            userInfo.style.display = 'inline';
            guestInfo.style.display = 'none';
        } catch (error) {
            console.error('Error parsing user data:', error);
            // Если ошибка парсинга, очищаем localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showGuestInterface();
        }
    } else {
        showGuestInterface();
    }

    // Обработчик выхода
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Очищаем localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Перенаправляем на главную страницу
            window.location.href = '/';
        });
    }

    function showGuestInterface() {
        userInfo.style.display = 'none';
        guestInfo.style.display = 'inline';
    }
}); 