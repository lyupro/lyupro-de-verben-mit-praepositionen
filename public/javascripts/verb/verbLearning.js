// public/javascripts/verb/verbLearning.js

import { startGame, hideGameContainer, showVerbDetails, hideVerbDetails, showGameContainer, resetGameContainer, showGameSettings } from './games/verbLearningGameVisually.js';

document.addEventListener('DOMContentLoaded', () => {
    const startLearningBtn = document.getElementById('startLearningBtn');
    const verbDetails = document.querySelector('.verbDetails');

    startLearningBtn.addEventListener('click', () => {
        if (verbDetails) {
            const letter = verbDetails.dataset.letter;
            const verb = verbDetails.dataset.verb;

            fetchVerbData(letter, verb)
                .then(data => {
                    console.log('verbLearning.js | data: ', data);
                    if (data.translation && data.translation.translations) {
                        hideVerbDetails();
                        showGameContainer();
                        resetGameContainer();
                        showGameSettings(data.verb, data.translation.translations);
                    } else {
                        console.error('Отсутствует перевод или варианты перевода');
                    }
                })
                .catch(error => {
                    console.error('Ошибка при получении данных:', error);
                });
        } else {
            console.error('Элемент .verbDetails не найден');
        }
    });

    function fetchVerbData(letter, verb) {
        return fetch(`/verbs/letter/${letter}/${verb}/learn/visually`)
            .then(response => response.json());
    }
});