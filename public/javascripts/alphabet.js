// public/javascripts/alphabet.js
import { fetchNamedRoute } from './utils/namedRoutes.js';

// Функция для загрузки глаголов по букве
async function loadVerbsByLetter(letter, page = 1) {
    try {
        const url = await fetchNamedRoute('verbs.letter.page', { letter, page });
        const response = await fetch(url);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const verbList = document.querySelector('.verbs');
        const paginationContainer = document.querySelector('.pagination');
        const titleElement = document.querySelector('title');
        const headerElement = document.querySelector('h1');

        if (verbList && paginationContainer && titleElement && headerElement) {
            verbList.innerHTML = doc.querySelector('.verbs').innerHTML;
            paginationContainer.innerHTML = doc.querySelector('.pagination').innerHTML;
            titleElement.textContent = doc.querySelector('title').textContent;
            headerElement.textContent = doc.querySelector('h1').textContent;
            history.pushState(null, null, url);

            // Обновляем обработчики событий для пагинации
            const paginationLinks = paginationContainer.querySelectorAll('a');
            paginationLinks.forEach(link => {
                link.addEventListener('click', paginationClickHandler);
            });
        } else {
            console.error('Elements .verbs or .pagination not found');
        }
    } catch (error) {
        console.error('Error loading verbs:', error);
    }
}

// Функция для загрузки всех глаголов
async function loadAllVerbs() {
    try {
        const url = await fetchNamedRoute('verbs.index');
        const response = await fetch(url);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const verbList = document.querySelector('.verbs');
        const paginationContainer = document.querySelector('.pagination');
        const titleElement = document.querySelector('title');
        const headerElement = document.querySelector('h1');

        if (verbList && paginationContainer && titleElement && headerElement) {
            verbList.innerHTML = doc.querySelector('.verbs').innerHTML;
            paginationContainer.innerHTML = doc.querySelector('.pagination').innerHTML;
            titleElement.textContent = doc.querySelector('title').textContent;
            headerElement.textContent = doc.querySelector('h1').textContent;
            history.pushState(null, null, '/verbs');

            // Обновляем обработчики событий для пагинации
            const paginationLinks = paginationContainer.querySelectorAll('a');
            paginationLinks.forEach(link => {
                link.addEventListener('click', paginationClickHandler);
            });
        } else {
            console.error('One or more required elements not found');
        }
    } catch (error) {
        console.error('Error loading verbs:', error);
    }
}

// Обработчик события 'click' для ссылок пагинации
function paginationClickHandler(event) {
    event.preventDefault();
    const url = this.getAttribute('href');
    loadVerbs(url);
}

// Функция для загрузки глаголов по URL
async function loadVerbs(url) {
    const urlParts = url.split('/');
    const letter = urlParts[urlParts.length - 2];
    const page = urlParts[urlParts.length - 1];

    if (url === await fetchNamedRoute('verbs.index')) {
        await loadAllVerbs();
    } else {
        await loadVerbsByLetter(letter, page);
    }
}

// Добавление обработчиков событий для ссылок на буквы алфавита
document.addEventListener('DOMContentLoaded', function() {
    const alphabetLinks = document.querySelectorAll('.alphabet a');
    let currentLetter = null;

    alphabetLinks.forEach(link => {
        link.addEventListener('click', async function(event) {
            event.preventDefault();
            const letter = this.getAttribute('data-letter');
            console.log('public/javascripts/alphabet.js | letter: ', letter);

            if (letter === currentLetter) {
                const url = await fetchNamedRoute('verbs.index');
                history.pushState(null, null, url);
                await loadAllVerbs();
                currentLetter = null; // Сбрасываем значение currentLetter
            } else {
                await loadVerbsByLetter(letter);
                currentLetter = letter;
            }
        });
    });
});