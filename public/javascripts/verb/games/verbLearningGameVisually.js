// public/javascripts/verb/games/verbLearningGameVisually.js

export function startGame(verb, translations, selectedTranslation, repetitions) {
    const gameContainer = document.getElementById('gameContainer');
    const cardContainer = document.getElementById('cardContainer');
    //const backBtn = document.getElementById('backBtn');
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
            currentWord = isShowingVerb ? verb : selectedTranslation;
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

        repetitions--;
        if (repetitions > 0) {
            showEndGameScreen(verb, translations, selectedTranslation, repetitions);
        } else {
            showFinalEndGameScreen();
        }
    }

    function showEndGameScreen(verb, translations, selectedTranslation, repetitions) {
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.innerHTML = `
        <div class="endGameScreen">
            <h3>Упражнение завершено!</h3>
            <p>Осталось повторений: ${repetitions}</p>
            <button id="restartBtn" class="btn btn-primary">Повторить</button>
            <button id="exitBtn" class="btn btn-secondary">Выйти</button>
        </div>
    `;

        const restartBtn = document.getElementById('restartBtn');
        const exitBtn = document.getElementById('exitBtn');

        restartBtn.addEventListener('click', () => {
            resetGameContainer();
            startGame(verb, translations, selectedTranslation, repetitions);
        });

        exitBtn.addEventListener('click', () => {
            hideGameContainer();
            showVerbDetails();
        });
    }

    function showFinalEndGameScreen() {
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.innerHTML = `
        <div class="endGameScreen">
            <h3>Игра окончена!</h3>
            <button id="exitBtn" class="btn btn-secondary">Выйти</button>
        </div>
    `;

        const exitBtn = document.getElementById('exitBtn');
        exitBtn.addEventListener('click', () => {
            hideGameContainer();
            showVerbDetails();
        });
    }

    function addEndGameEventListeners(verb, translation) {
        const restartBtn = document.getElementById('restartBtn');
        const exitBtn = document.getElementById('exitBtn');

        restartBtn.addEventListener('click', () => {
            currentWaveIndex = 0;
            resetGameContainer();
            startGame(verb, translation);
        });

        exitBtn.addEventListener('click', () => {
            hideGameContainer();
            showVerbDetails();
        });
    }

    function stopGame() {
        clearInterval(timer);
        clearTimeout(waveTimer);
        endGame();
    }

    //function addBackButtonEventListener() {
    //    if (backBtn) {
    //        backBtn.addEventListener('click', () => {
    //            clearInterval(timer);
    //            clearTimeout(waveTimer);
    //            hideGameContainer();
    //            showVerbDetails();
    //        });
    //    }
    //}

    function addStopButtonEventListener() {
        if (stopBtn) {
            stopBtn.addEventListener('click', stopGame);
        }
    }

    //addBackButtonEventListener();
    addStopButtonEventListener();
    startWave();
}

export function showGameSettings(verb, translations) {
    const gameContainer = document.getElementById('gameContainer');

    let translationOptions = '';
    translations.forEach((translation, index) => {
        translationOptions += `<option value="${translation}">${translation}</option>`;
    });

    gameContainer.innerHTML = `
        <div class="gameSettings">
            <h3>Настройки игры</h3>
            <div>
                <label for="translationSelect">Выберите перевод:</label>
                <select id="translationSelect">${translationOptions}</select>
            </div>
            <div>
                <label for="repetitionsInput">Количество повторений:</label>
                <input type="number" id="repetitionsInput" min="1" max="10" value="1">
            </div>
            <button id="startGameBtn" class="btn btn-primary">Начать игру</button>
        </div>
    `;

    const startGameBtn = document.getElementById('startGameBtn');
    startGameBtn.addEventListener('click', () => {
        const translationSelect = document.getElementById('translationSelect');
        const repetitionsInput = document.getElementById('repetitionsInput');

        const selectedTranslation = translationSelect.value;
        const repetitions = parseInt(repetitionsInput.value, 10);

        resetGameContainer();
        startGame(verb, translations, selectedTranslation, repetitions);
    });
}

export function showGameContainer() {
    const verbLearningGameContainer = document.getElementById('verbLearningGameContainer');
    const startLearningBtn = document.getElementById('startLearningBtn');
    const gameContainer = document.getElementById('gameContainer');

    startLearningBtn.style.display = 'none';
    gameContainer.style.display = 'block';
    verbLearningGameContainer.style.display = 'block';
}

export function hideGameContainer() {
    const verbLearningGameContainer = document.getElementById('verbLearningGameContainer');
    const gameContainer = document.getElementById('gameContainer');
    const startLearningBtn = document.getElementById('startLearningBtn');

    gameContainer.style.display = 'none';
    verbLearningGameContainer.style.display = 'block';
    startLearningBtn.style.display = 'block';
}

export function resetGameContainer() {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.innerHTML = `
        <!--<button id="backBtn" class="btn btn-secondary">Назад</button>-->
        <button id="stopBtn" class="btn btn-danger">Стоп</button>
        <div id="cardContainer" class="card-container"></div>
    `;
}

export function showVerbDetails() {
    const verbDetails = document.querySelector('.verbDetails');
    const startLearningBtn = document.getElementById('startLearningBtn');

    verbDetails.style.display = 'block';
    startLearningBtn.style.display = 'block';
}

export function hideVerbDetails() {
    const verbDetails = document.querySelector('.verbDetails');
    verbDetails.style.display = 'none';
}