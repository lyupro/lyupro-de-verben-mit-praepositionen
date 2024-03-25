// public/javascripts/pagination.js

// Функция для загрузки глаголов при переходе на другую страницу через пагинацию
async function loadVerbs(url) {
    try {
        console.log('Загрузка глаголов с URL:', url);

        const response = await fetch(url);
        console.log('Ответ получен:', response);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const html = await response.text();
        console.log('HTML получен:', html);

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        console.log('HTML разобран:', doc);

        // Обновляем только содержимое контейнера с глаголами
        const verbListContainer = document.querySelector('.verb-list');
        if (verbListContainer) {
            verbListContainer.innerHTML = doc.querySelector('.verb-list').innerHTML;
            console.log('Контейнер с глаголами обновлен');
        } else {
            console.warn('Контейнер с глаголами не найден');
        }

        // Обновляем блок пагинации
        const paginationContainer = document.querySelector('.pagination');
        if (paginationContainer) {
            paginationContainer.innerHTML = doc.querySelector('.pagination').innerHTML;
            console.log('Блок пагинации обновлен');
        } else {
            console.warn('Блок пагинации не найден');
        }

        // Обновляем URL-адрес страницы без перезагрузки
        history.pushState(null, null, url);
        console.log('URL-адрес страницы обновлен:', url);

        // Сбрасываем состояние поля поиска и окна результатов
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        if (searchInput && searchResults) {
            searchInput.value = '';
            searchResults.innerHTML = '';
            searchResults.classList.add('hidden');
            console.log('Состояние поля поиска и окна результатов сброшено');
        } else {
            console.warn('Поле поиска или окно результатов не найдены');
        }
    } catch (error) {
        console.error('Ошибка при загрузке глаголов:', error);
    }
}

// Обработчик события 'click' для пагинации
document.addEventListener('click', function (event) {
    if (event.target.matches('.pagination a')) {
        event.preventDefault();
        const url = event.target.getAttribute('href');
        loadVerbs(url);
    }
});