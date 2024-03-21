// public/javascripts/search.js

// Функция для отображения результатов поиска
function displaySearchResults(verbs) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    if (verbs.length > 0) {
        const resultList = document.createElement('ul');
        verbs.forEach(verb => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `/verb-list/letter/${verb.verb.charAt(0).toUpperCase()}/${verb.verb}`;
            link.textContent = `${verb.verb} - ${verb.translation}`;
            listItem.appendChild(link);
            resultList.appendChild(listItem);
        });
        searchResults.appendChild(resultList);
    } else {
        searchResults.textContent = 'Ничего не найдено';
    }
}

// Функция для добавления обработчиков событий к полю поиска
function addSearchEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    // Обработчик события 'input' для поля поиска
    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim();
        if (query) {
            // Если есть введенный текст, выполняем поиск
            const response = await fetch(`/verb-list/search?q=${query}`);
            const verbs = await response.json();
            displaySearchResults(verbs);
            // Показываем окно результатов при вводе текста
            searchResults.classList.remove('hidden');
        } else {
            // Если поле поиска пустое, скрываем окно результатов
            searchResults.classList.add('hidden');
        }
    });

    // Обработчик события 'blur' для поля поиска
    searchInput.addEventListener('blur', () => {
        // Добавляем задержку перед скрытием окна результатов поиска
        setTimeout(() => {
            searchResults.classList.add('hidden');
        }, 200);
    });

    // Обработчик события 'focus' для поля поиска
    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.trim();
        if (query) {
            // Если есть введенный текст и поле поиска в фокусе, показываем окно результатов
            searchResults.classList.remove('hidden');
        }
    });
}