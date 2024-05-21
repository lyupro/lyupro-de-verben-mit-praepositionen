// public/javascripts/themeSwitch.js

document.addEventListener('DOMContentLoaded', () => {
    const darkThemeLink = document.getElementById('dark-theme-link');
    const themeSwitchToggle = document.getElementById('theme-switch-toggle');

    // Проверяем предпочтение пользователя из localStorage
    const isDarkThemePreferred = localStorage.getItem('darkThemePreferred') === 'true';
    themeSwitchToggle.checked = isDarkThemePreferred;
    darkThemeLink.disabled = !isDarkThemePreferred;

    themeSwitchToggle.addEventListener('change', () => {
        darkThemeLink.disabled = !themeSwitchToggle.checked;
        localStorage.setItem('darkThemePreferred', themeSwitchToggle.checked);
    });
});