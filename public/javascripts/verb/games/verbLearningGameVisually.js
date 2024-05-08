// public/javascripts/verb/games/verbLearningGameVisually.js

export function startGame(verb, translation) {
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
        showEndGameScreen();
        addEndGameEventListeners(verb, translation);
    }

    function showEndGameScreen() {
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.innerHTML = `
        <div class="endGameScreen">
            <h3>Упражнение завершено!</h3>
            <button id="restartBtn" class="btn btn-primary">Повторить</button>
            <button id="exitBtn" class="btn btn-secondary">Выйти</button>
        </div>
    `;
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

export function hideGameContainer() {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.style.display = 'none';
}

export function showVerbDetails() {
    const verbDetails = document.querySelector('.verbDetails');
    verbDetails.style.display = 'block';
}

export function showGameContainer() {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.style.display = 'block';
}

export function resetGameContainer() {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.innerHTML = `
        <!--<button id="backBtn" class="btn btn-secondary">Назад</button>-->
        <button id="stopBtn" class="btn btn-danger">Стоп</button>
        <div id="cardContainer" class="card-container"></div>
    `;
}