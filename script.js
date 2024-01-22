document.addEventListener('DOMContentLoaded', function () {
    const targetSpawnArea = document.getElementById('targetSpawnArea');
    const target = document.getElementById('target');
    const scorePopup = document.getElementById('scorePopup');
    const finalScoreElement = document.getElementById('finalScore');
    const restartPopupButton = document.getElementById('restartPopupButton');
    const backToHomeButton = document.getElementById('backToHomeButton');
    const timerElement = document.getElementById('timer');
    let startTime, endTime, timer, interval, score;

    score = 0;
    timer = 30;
    timerElement.innerText = timer;
    interval = setInterval(countdown, 1000);
    showTarget();

    function showTarget() {
        if (!scorePopup.style.display || scorePopup.style.display === 'none') {
            const spawnAreaRect = targetSpawnArea.getBoundingClientRect();
            const targetWidth = 96;
            const targetHeight = 148;
            const maxX = spawnAreaRect.width - targetWidth;
            const maxY = spawnAreaRect.height - targetHeight;
            const randomX = Math.min(Math.max(spawnAreaRect.left + 5 + Math.random() * maxX, spawnAreaRect.left + 5), spawnAreaRect.right - targetWidth);
            const randomY = Math.min(Math.max(spawnAreaRect.top + 5 + Math.random() * maxY, spawnAreaRect.top), spawnAreaRect.bottom - targetHeight);

            target.style.left = `${randomX}px`;
            target.style.top = `${randomY}px`;

            target.style.display = 'block';
            //startTime = new Date();
        }
    }

    function hideTarget() {
        target.style.display = 'none';
    }

    function updateScore() {
        score++;
    }

    function targetClicked() {
        //endTime = new Date();
        //const reactionTime = endTime - startTime;
        //console.log(`Reaction time: ${reactionTime} milliseconds`);
        hideTarget();
        showTarget();
        updateScore();
    }

    function countdown() {
        let timeLeft = parseInt(timerElement.innerText);
        if (timeLeft === 0) {
            clearInterval(interval);
            displayScorePopup();
        } else {
            timeLeft--;
            timerElement.innerText = timeLeft;
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
        interval = setInterval(countdown, 1000);
        showTarget();
    }

    target.addEventListener('click', targetClicked);
    restartPopupButton.addEventListener('click', restartGame);
});