// public/javascripts/search.js

// Функция для отображения результатов поиска
async function displaySearchResults(verbs) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    if (verbs.length > 0) {
        const resultList = document.createElement('ul');
        await Promise.all(verbs.map(async verb => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            //link.href = `/verbs/${verb.verb.charAt(0).toLowerCase()}/${verb.verb}`;
            //link.href = `${window.getNamedRoute('verbs.show', { letter: verb.verb.charAt(0).toLowerCase(), verb: verb.verb })}`;
            const letter = verb.verb.charAt(0).toLowerCase(); // Объявляем letter здесь
            const url = await fetchNamedRoute('verbs.show', { letter, verb: verb.verb });
            link.href = url;
            link.textContent = `${verb.verb} - ${verb.translation}`;
            listItem.appendChild(link);
            resultList.appendChild(listItem);
        }));
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
            const response = await fetch(`/verbs/search?q=${query}`);
            //const response = await fetch(`${window.getNamedRoute('verbs.search')}?q=${query}`);
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

async function fetchNamedRoute(name, params) {
    const response = await fetch(`/api/named-routes?name=${name}&params=${JSON.stringify(params)}`);
    const data = await response.json();

    if (response.ok) {
        return data.url;
    } else {
        throw new Error(data.error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    addSearchEventListeners();
});