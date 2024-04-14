// public/javascripts/pagination.js

// Функция для загрузки глаголов при переходе на другую страницу через пагинацию
async function loadVerbs(url) {
    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Обновляем только содержимое контейнера с глаголами
        const verbListContainer = document.querySelector('.verbs');
        if (verbListContainer) {
            verbListContainer.innerHTML = doc.querySelector('.verbs').innerHTML;
        } else {
        }

        // Обновляем блок пагинации
        const paginationContainer = document.querySelector('.pagination');
        if (paginationContainer) {
            paginationContainer.innerHTML = doc.querySelector('.pagination').innerHTML;
        } else {
        }

        // Получаем значения pageTitle и pageHeader
        const titleElement = document.querySelector('title');
        const headerElement = document.querySelector('h1');
        if (titleElement && headerElement) {
            titleElement.textContent = doc.querySelector('title').textContent;
            headerElement.textContent = doc.querySelector('h1').textContent;
        }

        // Обновляем URL-адрес страницы без перезагрузки
        history.pushState(null, null, url);

        // Сбрасываем состояние поля поиска и окна результатов
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        if (searchInput && searchResults) {
            searchInput.value = '';
            searchResults.innerHTML = '';
            searchResults.classList.add('hidden');
        } else {
        }
    } catch (error) {
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