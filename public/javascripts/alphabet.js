// public/javascripts/alphabet.js

document.addEventListener('DOMContentLoaded', function() {
    const alphabetLinks = document.querySelectorAll('.alphabet a');
    let currentLetter = null;

    function loadVerbsByLetter(event) {
        event.preventDefault();
        const letter = this.getAttribute('href').split('/').pop();
        const page = 1;


        if (letter === currentLetter) {
            // Если нажата та же буква, загружаем страницу /verbs
            fetch(`/verbs`)
                .then(response => response.text())
                .then(html => {
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
                        history.pushState(null, null, `/verbs`);
                        currentLetter = null;

                        // Обновляем обработчики событий для пагинации
                        const paginationLinks = paginationContainer.querySelectorAll('a');
                        paginationLinks.forEach(link => {
                            link.addEventListener('click', paginationClickHandler);
                        });
                    } else {
                        console.error('One or more required elements not found');
                    }
                })
                .catch(error => console.error('Error loading verbs:', error));
        } else {
            // Если нажата другая буква, загружаем страницу с глаголами по букве
            fetch(`/verbs/${letter}/${page}`)
                .then(response => response.text())
                .then(html => {
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
                        history.pushState(null, null, `/verbs/${letter}/${page}`);
                        currentLetter = letter;

                        // Обновляем обработчики событий для пагинации
                        const paginationLinks = paginationContainer.querySelectorAll('a');
                        paginationLinks.forEach(link => {
                            link.addEventListener('click', paginationClickHandler);
                        });
                    } else {
                        console.error('Elements .verbs or .pagination not found');
                    }
                })
                .catch(error => console.error('Error loading verbs:', error));
        }
    }

    function paginationClickHandler(event) {
        event.preventDefault();
        const url = this.getAttribute('href');
        loadVerbs(url);
    }

    alphabetLinks.forEach(link => link.addEventListener('click', loadVerbsByLetter));
});