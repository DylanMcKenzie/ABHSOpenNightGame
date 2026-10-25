document.addEventListener('DOMContentLoaded', function () {
    const area = document.getElementById('targetSpawnArea');
    const target = document.getElementById('target');
    const popup = document.getElementById('scorePopup');
    const timer = document.getElementById('timer');
    const timeDisplay = timer.parentElement;
    const roundLength = 30_000;
    let deadline = 0;
    let appearedAt = 0;
    let score = 0;
    let reactionTotal = 0;
    let running = false;
    let countdownId;

    function positionTarget(randomise = true) {
        // Coordinates are local to the field; its border and the controls are excluded.
        const inset = 12;
        const maxX = Math.max(inset, area.clientWidth - target.offsetWidth - inset);
        const maxY = Math.max(inset, area.clientHeight - target.offsetHeight - inset);
        const x = randomise ? inset + Math.random() * (maxX - inset) : Math.min(maxX, Math.max(inset, parseFloat(target.style.left) || inset));
        const y = randomise ? inset + Math.random() * (maxY - inset) : Math.min(maxY, Math.max(inset, parseFloat(target.style.top) || inset));
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
    }

    function finishRound() {
        if (!running) return;
        running = false;
        clearTimeout(countdownId);
        target.hidden = true;
        target.disabled = true;
        timer.textContent = '0';
        document.getElementById('finalScore').textContent = score;
        document.getElementById('avrgRT').textContent = score ? Math.floor(reactionTotal / score) : '—';
        document.getElementById('reactionUnit').hidden = score === 0;
        document.getElementById('resultsMessage').textContent = score ? 'Nice work! Fancy another go?' : 'No crests caught this time. Have another go!';
        popup.showModal();
    }

    function updateTimer() {
        const remaining = Math.max(0, deadline - performance.now());
        timer.textContent = Math.ceil(remaining / 1000);
        timeDisplay.dataset.ending = remaining <= 5000;
        if (remaining === 0) finishRound();
        else countdownId = setTimeout(updateTimer, Math.min(100, remaining));
    }

    function startRound() {
        clearTimeout(countdownId);
        const restarting = popup.open;
        if (popup.open) popup.close();
        score = 0;
        reactionTotal = 0;
        target.hidden = false;
        target.disabled = false;
        positionTarget();
        appearedAt = performance.now();
        deadline = appearedAt + roundLength;
        running = true;
        updateTimer();
        if (restarting) target.focus({ preventScroll: true });
    }

    function catchTarget() {
        if (!running) return;
        const now = performance.now();
        // A late input cannot score even if a throttled timer hasn't fired yet.
        if (now >= deadline) { finishRound(); return; }
        reactionTotal += now - appearedAt;
        score += 1;
        positionTarget();
        appearedAt = performance.now();
    }

    target.addEventListener('pointerdown', function (event) {
        if (!event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        catchTarget();
    });
    // Native activation supports keyboard and assistive technology without
    // counting the compatibility click following a mouse or touch press twice.
    target.addEventListener('click', function (event) {
        if (event.detail === 0) catchTarget();
    });
    target.addEventListener('keydown', function (event) {
        if (event.repeat) event.preventDefault();
    });
    popup.addEventListener('cancel', event => event.preventDefault());
    document.getElementById('restartPopupButton').addEventListener('click', startRound);
    new ResizeObserver(() => { if (running) positionTarget(false); }).observe(area);
    document.addEventListener('visibilitychange', () => { if (running) { clearTimeout(countdownId); updateTimer(); } });

    // Decode the crest before timing so asset loading isn't counted as reaction time.
    target.querySelector('img').decode().then(startRound).catch(startRound);
});
