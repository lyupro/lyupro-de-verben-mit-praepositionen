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
        }

        // Обновляем блок пагинации
        const paginationContainer = document.querySelector('.pagination');
        if (paginationContainer) {
            paginationContainer.innerHTML = doc.querySelector('.pagination').innerHTML;
        }

        // Получаем значения pageTitle и pageHeader
        const titleElement = document.querySelector('title');
        const headerElement = document.querySelector('h1');
        if (titleElement && headerElement) {
            titleElement.textContent = doc.querySelector('title').textContent;
            headerElement.textContent = doc.querySelector('h1').textContent;
        }

        // Сбрасываем состояние поля поиска и окна результатов
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        if (searchInput && searchResults) {
            searchInput.value = '';
            searchResults.innerHTML = '';
            searchResults.classList.add('hidden');
        }

        // Обновляем URL-адрес страницы без перезагрузки
        history.pushState(null, null, url);
    } catch (error) {
        console.error('Error loading verbs:', error);
    }
}

// Обработчик события 'click' для пагинации
document.addEventListener('click', async function (event) {
    if (event.target.matches('.pagination a')) {
        event.preventDefault();
        const url = event.target.getAttribute('href');
        const page = event.target.getAttribute('data-page');
        await loadVerbs(url, page);
    }
});