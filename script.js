document.addEventListener('DOMContentLoaded', function () {
    const targetSpawnArea = document.getElementById('targetSpawnArea');
    const target = document.getElementById('target');
    const scorePopup = document.getElementById('scorePopup');
    const finalScoreElement = document.getElementById('finalScore');
    const restartPopupButton = document.getElementById('restartPopupButton');
    const backToHomeButton = document.getElementById('backToHomeButton');
    const timerElement = document.getElementById('timer');
    const reactionTimes = [];
    let startTime, endTime, timer, score;

    score = 0;
    timer = 30;
    timerElement.innerText = timer;
    showTarget();
    countdown();

    function showTarget() {
        if (!scorePopup.style.display || scorePopup.style.display === 'none') {
            const spawnAreaRect = targetSpawnArea.getBoundingClientRect();
            const targetWidth = 96;
            const targetHeight = 148;
            const maxX = spawnAreaRect.width - targetWidth;
            const maxY = spawnAreaRect.height - targetHeight;
            const randomX = Math.min(Math.max(spawnAreaRect.left + Math.random() * maxX, spawnAreaRect.left), spawnAreaRect.right - targetWidth);
            const randomY = Math.min(Math.max(spawnAreaRect.top + Math.random() * maxY, spawnAreaRect.top), spawnAreaRect.bottom - targetHeight);

            target.style.left = `${randomX}px`;
            target.style.top = `${randomY}px`;

            target.style.display = 'block';
            startTime = new Date();
        }
    }
    
    function hideTarget() {
        target.style.display = 'none';
    }

    function updateScore() {
        score++;
    }

    function targetClicked() {
        hideTarget();
        showTarget();
        updateScore();
    }

    function countdown() {
        let timeLeft = parseInt(timerElement.innerText);
        if (timeLeft === 0) {
            displayScorePopup();
        } else {
            timeLeft--;
            timerElement.innerText = timeLeft;
            setTimeout(countdown, 1000);
        }
    }

    function displayScorePopup() {
        finalScoreElement.innerHTML = `Final Score: <span id="scoreValue">${score}</span>`;
        scorePopup.style.display = 'block';
    }

    function restartGame() {
        hideTarget();
        scorePopup.style.display = 'none';
        score = 0;
        timer = 30;
        timerElement.innerText = timer;
        setTimeout(countdown, 1000);
        showTarget();
    }

    target.addEventListener('click', targetClicked);
    restartPopupButton.addEventListener('click', restartGame);
});
