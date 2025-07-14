// --- Element References ---
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
const countdownTimer = document.getElementById('countdown-timer');
const pauseBtn = document.getElementById('pause-btn');
const pauseModal = document.getElementById('pause-modal');
const resumeBtn = document.getElementById('resume-btn');
const horizontalProgressBar = document.getElementById('horizontal-progress-bar');
const progressText = document.getElementById('progress-text');
const factBanner = document.getElementById('fact-banner');
const POINTS_TO_FILL_BUCKET = 75;

// --- Game State ---
let lives = 5;
let bucketsFilled = 0;
let currentFill = 0;
let countdown = 10;
let countdownInterval;
let autoDropTimeout;
let isPaused = false;
let factIndex = 0;
let factRotationInterval;

const facts = [
  "1 in 10 people worldwide lack access to clean water.",
  "Every day, women and girls spend 200 million hours collecting water.",
  "Charity: Water has funded over 120,000 water projects since 2006.",
  "Access to clean water can cut child mortality by up to 21%.",
  "Charity: Water works in 29 countries around the world.",
  "Dirty water kills more people every year than all forms of violence, including war.",
  "Access to clean water improves school attendance, especially for girls.",
  "In communities with clean water, income can increase by up to 50%.",
  "100% of public donations to Charity: Water fund clean water projects.",
  "Charity: Water uses remote sensors to monitor water point functionality in real-time."
];

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

function shuffleBucketValues() {
  const values = [10, 20, 30, 40, 50];
  const shuffled = values.sort(() => 0.5 - Math.random()).slice(0, 3);
  document.querySelectorAll('.bucket').forEach((bucket, index) => {
    bucket.setAttribute('data-points', shuffled[index]);
    bucket.querySelector('.bucket-value').textContent = shuffled[index];
  });
}

function createPegs() {
  const rows = 7;
  const cols = 6;
  const spacingX = 40;
  const spacingY = 50;
  const offset = 20;

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const peg = document.createElement('div');
      peg.classList.add('peg');

      const jitterX = Math.floor(Math.random() * 7) - 3;
      const jitterY = Math.floor(Math.random() * 7) - 3;

      peg.style.left = `${(c * spacingX) + (r % 2 === 0 ? offset : 0) + jitterX + 30}px`;
      peg.style.top = `${r * spacingY + jitterY + 40}px`;

      plinkoBoard.appendChild(peg);
    }
  }
}

// --- Cloud Drag ---
let isDragging = false;
let offsetX;

cloud.addEventListener('mousedown', (e) => {
  isDragging = true;
  offsetX = e.offsetX;
  cloud.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
  if (isDragging && !isPaused) {
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

// --- Droplet Drop Logic ---
dropBtn.addEventListener('click', () => {
  if (lives <= 0 || isPaused) return;
  clearCountdown();
  lives--;
  updateLives();

  const droplet = document.createElement('div');
  droplet.classList.add('droplet');

  const isGolden = Math.random() < 0.1;
  if (isGolden) droplet.classList.add('golden');

  const cloudLeft = parseInt(cloud.style.left) || 110;
  droplet.style.left = `${cloudLeft + cloud.clientWidth / 2 - 13}px`;
  droplet.style.top = '0px';
  plinkoBoard.appendChild(droplet);

  let top = 0;
  const fallInterval = setInterval(() => {
    if (isPaused) return;
    top += 5;
    droplet.style.top = `${top}px`;

    document.querySelectorAll('.peg').forEach(peg => {
      const pegRect = peg.getBoundingClientRect();
      const dropRect = droplet.getBoundingClientRect();
      const dx = dropRect.left + dropRect.width / 2 - (pegRect.left + pegRect.width / 2);
      const dy = dropRect.top + dropRect.height / 2 - (pegRect.top + pegRect.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 10) {
        const direction = Math.random();
        const currentLeft = parseInt(droplet.style.left);
        if (direction < 0.5 && currentLeft > 5) {
          droplet.style.left = `${currentLeft - 10}px`;
        } else if (currentLeft < plinkoBoard.clientWidth - 30) {
          droplet.style.left = `${currentLeft + 10}px`;
        }
      }
    });

    if (top >= plinkoBoard.clientHeight - 50) {
      clearInterval(fallInterval);
      scorePoint(parseInt(droplet.style.left), isGolden);
      plinkoBoard.removeChild(droplet);
      shuffleBucketValues();
      plinkoBoard.querySelectorAll('.peg').forEach(p => p.remove());
      createPegs();
      if (lives === 0) setTimeout(endGame, 500);
    }
  }, 20);
});

function scorePoint(dropLeft, isGolden = false) {
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

  const pointsEarned = isGolden ? bucketPoints * 2 : bucketPoints;
  currentFill += pointsEarned;

  const splash = document.createElement('div');
  splash.classList.add('splash');
  if (isGolden) splash.classList.add('splash-golden');
  splash.style.left = `${dropLeft}px`;
  splash.style.top = `${plinkoBoard.clientHeight - 40}px`;
  plinkoBoard.appendChild(splash);
  setTimeout(() => splash.remove(), 500);

  // Create points popup
  const pointsPopup = document.createElement('div');
  pointsPopup.classList.add('points-popup');
  if (isGolden) pointsPopup.classList.add('golden-points');
  pointsPopup.textContent = `+${pointsEarned}`;
  pointsPopup.style.left = `${dropLeft}px`;
  pointsPopup.style.top = `${plinkoBoard.clientHeight - 60}px`;
  plinkoBoard.appendChild(pointsPopup);

  // Remove after 2 seconds
  setTimeout(() => pointsPopup.remove(), 2000);

  while (currentFill >= POINTS_TO_FILL_BUCKET) {
    currentFill -= POINTS_TO_FILL_BUCKET;
    bucketsFilled++;
    lives++;
    updateBucketsFilled();
    updateLives();
  }

  bigBucketFill.style.height = `${currentFill}%`;
  horizontalProgressBar.style.width = `${currentFill}%`;
  progressText.textContent = `${currentFill} / ${POINTS_TO_FILL_BUCKET}`;

  if (lives > 0) startCountdown(true);
}

function showFactBanner() {
  factBanner.textContent = `💧Fact: ${facts[factIndex]}`;
  factIndex = (factIndex + 1) % facts.length;
}

function startFactRotation() {
  showFactBanner();
  factRotationInterval = setInterval(showFactBanner, 10000);
}

function stopFactRotation() {
  clearInterval(factRotationInterval);
}

function endGame() {
  const name = playerNameInput.value.trim();
  saveScore(name, bucketsFilled);
  endGameMessage.textContent = `You filled ${bucketsFilled} buckets! Thank you for helping provide clean water.`;
  endGameModal.classList.add('active');
  updateLeaderboard();
  stopFactRotation();
}

playAgainBtn.addEventListener('click', () => {
  endGameModal.classList.remove('active');
  startGame();
});

resetBtn.addEventListener('click', () => {
  if (confirm("Are you sure you want to reset the game?")) startGame();
});

howToPlayBtn.addEventListener('click', () => {
  isPaused = true;
  clearCountdown(); // Stops the timer
  howToPlayModal.classList.add('active');
});

closeHowToPlay.addEventListener('click', () => {
  isPaused = false;
  howToPlayModal.classList.remove('active');
  // Resume timer from where it left off
  if (lives > 0) startCountdown(false);
});

aboutBtn.addEventListener('click', () => window.open('https://www.charitywater.org/about', '_blank'));
donateBtn.addEventListener('click', () => window.open('https://www.charitywater.org/donate', '_blank'));

startBtn.addEventListener('click', () => {
  const name = playerNameInput.value.trim();
  if (name) {
    playerDisplay.textContent = `Player: ${name}`;
    startScreen.classList.remove('active');
    startGame();
  }
});

function startGame() {
  lives = 5;
  bucketsFilled = 0;
  currentFill = 0;
  factIndex = 0;
  bigBucketFill.style.height = '0%';
  horizontalProgressBar.style.width = '0%';
  progressText.textContent = `0 / ${POINTS_TO_FILL_BUCKET}`;
  updateLives();
  updateBucketsFilled();
  updateLeaderboard();
  plinkoBoard.querySelectorAll('.peg').forEach(p => p.remove());
  plinkoBoard.querySelectorAll('.droplet').forEach(d => d.remove());
  createPegs();
  shuffleBucketValues();
  startCountdown(true); // Start with a fresh timer
  startFactRotation();
}

// This function starts or resumes the countdown timer.
// If reset is true, it starts from 10. If false, it resumes from current value.
function startCountdown(reset = true) {
  if (reset) {
    countdown = 10; // Start a new turn with 10 seconds
  }
  countdownTimer.textContent = `Time: ${countdown}`;

  clearInterval(countdownInterval);
  clearTimeout(autoDropTimeout);

  countdownInterval = setInterval(() => {
    countdown--;
    countdownTimer.textContent = `Time: ${countdown}`;
    if (countdown <= 0) clearInterval(countdownInterval);
  }, 1000);

  autoDropTimeout = setTimeout(() => {
    if (lives > 0 && !isPaused) dropBtn.click();
  }, countdown * 1000); // Use current countdown value for timeout
}

function clearCountdown() {
  clearInterval(countdownInterval);
  clearTimeout(autoDropTimeout);
}

pauseBtn.addEventListener('click', () => {
  isPaused = true;
  clearCountdown(); // Stops the timer
  pauseModal.classList.add('active');
});
resumeBtn.addEventListener('click', () => {
  isPaused = false;
  pauseModal.classList.remove('active');
  // Resume timer from where it left off
  if (lives > 0) {
    startCountdown(false); // Do not reset timer
  }
});

document.addEventListener('keydown', (e) => {
  if (isPaused || startScreen.classList.contains('active')) return;
  const step = 15;
  const cloudLeft = parseInt(cloud.style.left) || 110;
  const boardWidth = plinkoBoard.clientWidth;

  if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
    let newLeft = Math.max(0, cloudLeft - step);
    cloud.style.left = `${newLeft}px`;
  } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
    let newLeft = Math.min(boardWidth - cloud.clientWidth, cloudLeft + step);
    cloud.style.left = `${newLeft}px`;
  } else if (e.code === 'Space') {
    e.preventDefault();
    dropBtn.click();
  }
});

// Start screen
startScreen.classList.add('active');
updateLeaderboard();
