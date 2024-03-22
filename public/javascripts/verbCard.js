// public/javascripts/verbCard.js

document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.card');

    function flipCard() {
        if (window.innerWidth <= 768) {
            this.classList.toggle('flipped');
        }
    }

    cards.forEach(card => card.addEventListener('click', flipCard));
});