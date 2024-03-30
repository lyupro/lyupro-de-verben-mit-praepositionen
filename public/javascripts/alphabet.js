// public/javascripts/alphabet.js

document.addEventListener('DOMContentLoaded', function() {
    const alphabetLinks = document.querySelectorAll('.alphabet a');

    function loadVerbsByLetter(event) {
        event.preventDefault();
        const letter = this.getAttribute('href').split('/').pop();
        const page = 1;

        fetch(`/verbs/letter/${letter}/page/${page}`)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const verbList = document.querySelector('.verbs');
                const paginationContainer = document.querySelector('.pagination');

                if (verbList && paginationContainer) {
                    verbList.innerHTML = doc.querySelector('.verbs').innerHTML;
                    paginationContainer.innerHTML = doc.querySelector('.pagination').innerHTML;
                    history.pushState(null, null, `/verbs/letter/${letter}/page/${page}`);

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

    function paginationClickHandler(event) {
        event.preventDefault();
        const url = this.getAttribute('href');
        loadVerbs(url);
    }

    alphabetLinks.forEach(link => link.addEventListener('click', loadVerbsByLetter));
});