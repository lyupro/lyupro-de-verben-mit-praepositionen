// public/javascripts/verbCard.js

document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.card');

    function flipCard(event) {
        if (window.innerWidth <= 768 && !event.target.closest('a')) {
            this.classList.toggle('flipped');
        }
    }

    cards.forEach(card => card.addEventListener('click', flipCard));
});