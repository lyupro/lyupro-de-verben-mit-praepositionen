// public/javascripts/verb/verbLearning.js

import { startGame, hideGameContainer, showVerbDetails, showGameContainer, resetGameContainer } from './games/verbLearningGameVisually.js';

document.addEventListener('DOMContentLoaded', () => {
    const startLearningBtn = document.getElementById('startLearningBtn');
    const verbDetails = document.querySelector('.verbDetails');
    const gameContainer = document.getElementById('gameContainer');

    startLearningBtn.addEventListener('click', () => {
        if (verbDetails) {
            const letter = verbDetails.dataset.letter;
            const verb = verbDetails.dataset.verb;

            fetchVerbData(letter, verb)
                .then(data => {
                    console.log('verbLearning.js | data: ', data);
                    hideVerbDetails();
                    showGameContainer();
                    resetGameContainer();
                    startGame(data.verb, data.translation);
                })
                .catch(error => {
                    console.error('Ошибка при получении данных:', error);
                });
        } else {
            console.error('Элемент .verb-container не найден');
        }
    });

    function fetchVerbData(letter, verb) {
        return fetch(`/verbs/letter/${letter}/${verb}/learn/visually`)
            .then(response => response.json());
    }

    function hideVerbDetails() {
        verbDetails.style.display = 'none';
    }
});