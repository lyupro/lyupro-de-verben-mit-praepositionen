// public/javascripts/pagination.js

// Функция для загрузки глаголов при переходе на другую страницу через пагинацию
async function loadVerbs(page) {
    const response = await fetch(`/verb-list/page/${page}`);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Обновляем только содержимое контейнера с глаголами
    const verbListContainer = document.querySelector('.verb-list');
    verbListContainer.innerHTML = doc.querySelector('.verb-list').innerHTML;

    // Обновляем блок пагинации
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = doc.querySelector('.pagination').innerHTML;

    // Обновляем URL-адрес страницы без перезагрузки
    history.pushState(null, null, `/verb-list/page/${page}`);

    // Сбрасываем состояние поля поиска и окна результатов
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchResults.classList.add('hidden');
}

// Обработчик события 'click' для пагинации
document.querySelector('.pagination').addEventListener('click', function (event) {
    if (event.target.tagName === 'A') {
        event.preventDefault();
        const page = event.target.getAttribute('href').split('/').pop();
        loadVerbs(page);
    }
});