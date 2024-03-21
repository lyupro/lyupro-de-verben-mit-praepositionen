// public/javascripts/pagination.js

// Функция для загрузки глаголов при переходе на другую страницу через пагинацию
async function loadVerbs(page) {
    const response = await fetch(`/verb-list/page/${page}`);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    document.querySelector('body').innerHTML = doc.querySelector('body').innerHTML;
    history.pushState(null, null, `/verb-list/page/${page}`);

    // Сбрасываем состояние поля поиска и окна результатов
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchResults.classList.add('hidden');

    // Добавляем обработчики событий к новым элементам
    addSearchEventListeners();
}

// Обработчик события 'click' для пагинации
document.querySelector('.pagination').addEventListener('click', function (event) {
    if (event.target.tagName === 'A') {
        event.preventDefault();
        const page = event.target.getAttribute('href').split('/').pop();
        loadVerbs(page);
    }
});