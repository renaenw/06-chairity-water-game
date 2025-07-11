// Element references
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const playerNameInput = document.getElementById('player-name');
const playerDisplay = document.getElementById('player-display');
const livesDisplay = document.getElementById('lives');
const bucketsFilledDisplay = document.getElementById('buckets-filled');
const leaderboardList = document.getElementById('leaderboard-list');
const bigBucketFill = document.getElementById('bucket-fill');
const plinkoBoard = document.getElementById('plinko-board');
const cloud = document.getElementById('cloud');
const dropBtn = document.getElementById('drop-btn');
const howToPlayBtn = document.getElementById('how-to-play-btn');
const aboutBtn = document.getElementById('about-btn');
const donateBtn = document.getElementById('donate-btn');
const resetBtn = document.getElementById('reset-btn');
const howToPlayModal = document.getElementById('how-to-play-modal');
const closeHowToPlay = document.getElementById('close-how-to-play');
const endGameModal = document.getElementById('end-game-modal');
const endGameMessage = document.getElementById('end-game-message');
const playAgainBtn = document.getElementById('play-again-btn');

// Game state
let lives = 4;
let bucketsFilled = 0;
let currentFill = 0;

// Utility functions
function updateLives() {
    livesDisplay.textContent = `Drops: ${'💧'.repeat(lives)}`;
}

function updateBucketsFilled() {
    bucketsFilledDisplay.textContent = `Buckets Filled: ${bucketsFilled}`;
}

function updateLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('charityWaterScores')) || [];
    leaderboardList.innerHTML = '';
    scores.sort((a, b) => b.buckets - a.buckets).slice(0, 5).forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.name}: ${entry.buckets} buckets`;
        leaderboardList.appendChild(li);
    });
}

function saveScore(name, buckets) {
    const scores = JSON.parse(localStorage.getItem('charityWaterScores')) || [];
    scores.push({ name, buckets });
    localStorage.setItem('charityWaterScores', JSON.stringify(scores));
}

// Create pegs (skipping top and bottom row)
function createPegs() {
    const rows = 7;
    const cols = 6;
    const spacingX = 40;
    const spacingY = 50;
    const offset = 20;

    for (let r = 1; r < rows - 1; r++) { // skip row 0 (top) and row 6 (bottom)
        for (let c = 0; c < cols; c++) {
            const peg = document.createElement('div');
            peg.classList.add('peg');
            peg.style.top = `${r * spacingY + 40}px`;
            peg.style.left = `${(c * spacingX) + (r % 2 === 0 ? offset : 0) + 30}px`;
            plinkoBoard.appendChild(peg);
        }
    }
}

// Cloud dragging inside plinko-board
let isDragging = false;
let offsetX;

cloud.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.offsetX;
    cloud.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const boardRect = plinkoBoard.getBoundingClientRect();
        let x = e.clientX - boardRect.left - offsetX;
        x = Math.max(0, Math.min(x, boardRect.width - cloud.clientWidth));
        cloud.style.left = `${x}px`;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    cloud.style.cursor = 'grab';
});

// Drop functionality
dropBtn.addEventListener('click', () => {
    if (lives <= 0) return;
    lives--;
    updateLives();

    const droplet = document.createElement('div');
    droplet.classList.add('droplet');
    const cloudLeft = parseInt(cloud.style.left) || 0;
    droplet.style.left = `${cloudLeft + cloud.clientWidth / 2 - 13}px`;
    droplet.style.top = '0px';
    plinkoBoard.appendChild(droplet);

    let top = 0;
    const fallInterval = setInterval(() => {
        top += 5;
        droplet.style.top = `${top}px`;

        // Check peg collisions
        document.querySelectorAll('.peg').forEach(peg => {
            const pegRect = peg.getBoundingClientRect();
            const dropRect = droplet.getBoundingClientRect();
            const dx = dropRect.left + dropRect.width / 2 - (pegRect.left + pegRect.width / 2);
            const dy = dropRect.top + dropRect.height / 2 - (pegRect.top + pegRect.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 10) {
                const direction = Math.random();
                if (direction < 0.5 && parseInt(droplet.style.left) > 5) {
                    droplet.style.left = `${parseInt(droplet.style.left) - 10}px`;
                } else if (parseInt(droplet.style.left) < plinkoBoard.clientWidth - 30) {
                    droplet.style.left = `${parseInt(droplet.style.left) + 10}px`;
                }
            }
        });

        if (top >= plinkoBoard.clientHeight - 50) {
            clearInterval(fallInterval);
            scorePoint(parseInt(droplet.style.left));
            plinkoBoard.removeChild(droplet);
            if (lives === 0) {
                setTimeout(endGame, 500);
            }
        }
    }, 20);
});

// Scoring based on bucket hit
function scorePoint(dropLeft) {
    const boardRect = plinkoBoard.getBoundingClientRect();
    let bucketPoints = 10;

    document.querySelectorAll('.bucket').forEach(bucket => {
        const bucketRect = bucket.getBoundingClientRect();
        const bucketLeft = bucketRect.left - boardRect.left;
        const bucketRight = bucketLeft + bucketRect.width;
        if (dropLeft >= bucketLeft && dropLeft <= bucketRight) {
            bucketPoints = parseInt(bucket.getAttribute('data-points'));
        }
    });

    currentFill += bucketPoints;
    if (currentFill >= 100) {
        currentFill = 0;
        bucketsFilled++;
        lives++;
        updateBucketsFilled();
        updateLives();
    }
    bigBucketFill.style.height = `${currentFill}%`;
}

// End game logic
function endGame() {
    const name = playerNameInput.value.trim();
    saveScore(name, bucketsFilled);
    endGameMessage.textContent = `You filled ${bucketsFilled} buckets! Thank you for helping provide clean water.`;
    endGameModal.classList.add('active');
    updateLeaderboard();
}

// Play again button
playAgainBtn.addEventListener('click', () => {
    endGameModal.classList.remove('active');
    startGame();
});

// Reset button
resetBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset the game?")) {
        startGame();
    }
});

// Modal buttons
howToPlayBtn.addEventListener('click', () => howToPlayModal.classList.add('active'));
closeHowToPlay.addEventListener('click', () => howToPlayModal.classList.remove('active'));
aboutBtn.addEventListener('click', () => window.open('https://www.charitywater.org/about', '_blank'));
donateBtn.addEventListener('click', () => window.open('https://www.charitywater.org/donate', '_blank'));

// Start game on name entry
startBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name) {
        playerDisplay.textContent = `Player: ${name}`;
        startScreen.classList.remove('active');
        startGame();
    }
});

// Main game reset/start logic
function startGame() {
    lives = 4;
    bucketsFilled = 0;
    currentFill = 0;
    bigBucketFill.style.height = '0%';
    updateLives();
    updateBucketsFilled();
    updateLeaderboard();
    plinkoBoard.querySelectorAll('.peg').forEach(peg => peg.remove());
    plinkoBoard.querySelectorAll('.droplet').forEach(drop => drop.remove());
    createPegs();
}

// Initial setup
startScreen.classList.add('active');
updateLeaderboard();
