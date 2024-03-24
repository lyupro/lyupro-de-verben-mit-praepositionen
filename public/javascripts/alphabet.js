// public/javascripts/alphabet.js

document.addEventListener('DOMContentLoaded', function() {
    const alphabetLinks = document.querySelectorAll('.alphabet a');

    function loadVerbsByLetter(event) {
        event.preventDefault();
        const letter = this.getAttribute('href').split('/').pop();

        fetch(`/verb-list/letter/${letter}`)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const verbList = document.querySelector('.verb-list');
                verbList.innerHTML = doc.querySelector('.verb-list').innerHTML;
                history.pushState(null, null, `/verb-list/letter/${letter}`);
            })
            .catch(error => console.error('Error loading verbs:', error));
    }

    alphabetLinks.forEach(link => link.addEventListener('click', loadVerbsByLetter));
});