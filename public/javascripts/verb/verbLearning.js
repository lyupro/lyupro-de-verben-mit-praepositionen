document.addEventListener('DOMContentLoaded', () => {
    const startLearningBtn = document.getElementById('startLearningBtn');
    const verbContainer = document.querySelector('.verbContainer');
    const gameContainer = document.getElementById('gameContainer');

    startLearningBtn.addEventListener('click', () => {
        if (verbContainer) {
            const letter = verbContainer.dataset.letter;
            const verb = verbContainer.dataset.verb;

            // Отправляем AJAX-запрос для получения данных о слове
            fetch(`/verbs/letter/${letter}/${verb}/learn/visually`)
                .then(response => response.json())
                .then(data => {
                    console.log('verbLearning.js | data: ', data);

                    // Скрываем основное содержимое страницы
                    verbContainer.style.display = 'none';

                    // Отображаем игровой контейнер
                    gameContainer.style.display = 'block';

                    // Сбрасываем содержимое игрового контейнера
                    gameContainer.innerHTML = `
                        <button id="backBtn" class="btn btn-secondary">Назад</button>
                        <button id="stopBtn" class="btn btn-danger">Стоп</button>
                        <div id="cardContainer" class="card-container"></div>
                    `;

                    // Запускаем игру с полученными данными
                    startGame(data.verb, data.translation);
                })
                .catch(error => {
                    console.error('Ошибка при получении данных:', error);
                });
        } else {
            console.error('Элемент .verb-container не найден');
        }
    });

    function startGame(verb, translation) {
        const gameContainer = document.getElementById('gameContainer');
        const cardContainer = document.getElementById('cardContainer');
        const backBtn = document.getElementById('backBtn');
        const stopBtn = document.getElementById('stopBtn');

        let currentWord = verb;
        let isShowingVerb = true;

        const waves = [
            { duration: 30000, interval: 3000 },
            { duration: 20000, interval: 2000 },
            { duration: 10000, interval: 1000 },
            { duration: 20000, interval: 500 },
            { duration: 30000, interval: 3000 },
            { duration: 10000, interval: 250 },
            { duration: 20000, interval: 2000 },
            { duration: 7500, interval: 150 },
            { duration: 30000, interval: 3000 }
        ];

        let currentWaveIndex = 0;
        let timer;
        let waveTimer;

        function startWave() {
            const { duration, interval } = waves[currentWaveIndex];

            timer = setInterval(() => {
                currentWord = isShowingVerb ? verb : translation;
                isShowingVerb = !isShowingVerb;
                cardContainer.textContent = currentWord;
            }, interval);

            waveTimer = setTimeout(() => {
                clearInterval(timer);
                currentWaveIndex++;

                if (currentWaveIndex < waves.length) {
                    startWave();
                } else {
                    endGame();
                }
            }, duration);
        }

        function endGame() {
            clearInterval(timer);
            clearTimeout(waveTimer);

            gameContainer.innerHTML = `
                <h3>Упражнение завершено!</h3>
                <button id="restartBtn" class="btn btn-primary">Повторить</button>
                <button id="exitBtn" class="btn btn-secondary">Выйти</button>
            `;

            const restartBtn = document.getElementById('restartBtn');
            const exitBtn = document.getElementById('exitBtn');

            restartBtn.addEventListener('click', () => {
                currentWaveIndex = 0;
                gameContainer.innerHTML = `
                    <button id="backBtn" class="btn btn-secondary">Назад</button>
                    <button id="stopBtn" class="btn btn-danger">Стоп</button>
                    <div id="cardContainer" class="card-container"></div>
                `;
                startGame(verb, translation);
            });

            exitBtn.addEventListener('click', () => {
                gameContainer.style.display = 'none';
                verbContainer.style.display = 'block';
            });
        }

        function stopGame() {
            clearInterval(timer);
            clearTimeout(waveTimer);
            endGame();
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                clearInterval(timer);
                clearTimeout(waveTimer);
                gameContainer.style.display = 'none';
                verbContainer.style.display = 'block';
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', stopGame);
        }

        startWave();
    }
});