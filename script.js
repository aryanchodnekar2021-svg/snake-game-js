const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const settingsOverlay = document.getElementById('settingsOverlay');
const finalScoreElement = document.getElementById('finalScore');

// Inputs
const snakeColorInput = document.getElementById('snakeColorPicker');
const foodColorInput = document.getElementById('foodColorPicker');
const bgColorInput = document.getElementById('bgColorPicker');
const speedSlider = document.getElementById('speedSlider');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let velocityX = 0;
let velocityY = 0;
let food = { x: 15, y: 15 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;

// Settings Logic
let settings = {
    snakeColor: localStorage.getItem('snakeColor') || '#4ecca3',
    foodColor: localStorage.getItem('foodColor') || '#ff6b6b',
    bgColor: localStorage.getItem('bgColor') || '#1a1a1a',
    startSpeed: parseInt(localStorage.getItem('startSpeed')) || 150 // Default 150 (Slower)
};

let gameSpeed = settings.startSpeed;
let gameLoop;
let isPaused = false;
let isGameOver = false;

// Initialize Input Values based on saved settings
snakeColorInput.value = settings.snakeColor;
foodColorInput.value = settings.foodColor;
bgColorInput.value = settings.bgColor;
speedSlider.value = settings.startSpeed;

highScoreElement.textContent = highScore;

// --- Game Core ---

function startGame() {
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
}

function update() {
    if (isPaused || isGameOver) return;

    moveSnake();
    
    if (checkCollision()) {
        handleGameOver();
        return;
    }

    checkFoodCollision();
    draw();
}

function draw() {
    // 1. Draw Background
    ctx.fillStyle = settings.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawFood();
    drawSnake();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for(let i=0; i<tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i*gridSize, 0);
        ctx.lineTo(i*gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i*gridSize);
        ctx.lineTo(canvas.width, i*gridSize);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const size = gridSize - 2;

        ctx.fillStyle = settings.snakeColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = settings.snakeColor;

        ctx.beginPath();
        ctx.arc(x + gridSize/2, y + gridSize/2, size/2, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        if (index === 0) {
            drawEyes(x, y);
        }
    });
}

function drawEyes(x, y) {
    ctx.fillStyle = 'white';
    let eyeOffsetX = 0;
    let eyeOffsetY = 0;
    
    if (velocityX === 1) { eyeOffsetX = 6; }
    else if (velocityX === -1) { eyeOffsetX = -6; }
    else if (velocityY === 1) { eyeOffsetY = 6; }
    else if (velocityY === -1) { eyeOffsetY = -6; }
    else { eyeOffsetX = 6; } // Default look right

    // Left Eye
    ctx.beginPath();
    ctx.arc(x + gridSize/2 + eyeOffsetX - (velocityY!==0?4:0), y + gridSize/2 + eyeOffsetY - (velocityX!==0?4:0), 3, 0, Math.PI*2);
    ctx.fill();

    // Right Eye
    ctx.beginPath();
    ctx.arc(x + gridSize/2 + eyeOffsetX + (velocityY!==0?4:0), y + gridSize/2 + eyeOffsetY + (velocityX!==0?4:0), 3, 0, Math.PI*2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x + gridSize/2 + eyeOffsetX*1.2 - (velocityY!==0?4:0), y + gridSize/2 + eyeOffsetY*1.2 - (velocityX!==0?4:0), 1.5, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + gridSize/2 + eyeOffsetX*1.2 + (velocityY!==0?4:0), y + gridSize/2 + eyeOffsetY*1.2 + (velocityX!==0?4:0), 1.5, 0, Math.PI*2);
    ctx.fill();
}

function drawFood() {
    const x = food.x * gridSize + gridSize/2;
    const y = food.y * gridSize + gridSize/2;

    ctx.fillStyle = settings.foodColor;
    ctx.shadowBlur = 15;
    ctx.shadowColor = settings.foodColor;
    
    ctx.beginPath();
    ctx.arc(x, y, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#4ecca3';
    ctx.beginPath();
    ctx.ellipse(x, y - 8, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
}

function moveSnake() {
    const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
    snake.unshift(head);
    snake.pop();
}

function checkFoodCollision() {
    if (snake[0].x === food.x && snake[0].y === food.y) {
        score += 10;
        snake.push({ ...snake[snake.length - 1] });
        placeFood();
        
        // Speed up logic (capped so it doesn't get too fast)
        if (gameSpeed > 50) {
            clearInterval(gameLoop);
            gameSpeed = Math.max(50, gameSpeed - 1); 
            gameLoop = setInterval(update, gameSpeed);
        }
        
        scoreElement.textContent = score;
    }
}

function placeFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        placeFood();
    }
}

function checkCollision() {
    // Walls
    if (snake[0].x < 0 || snake[0].x >= tileCount || 
        snake[0].y < 0 || snake[0].y >= tileCount) {
        return true;
    }
    // Self
    for (let i = 1; i < snake.length; i++) {
        if (snake[0].x === snake[i].x && snake[0].y === snake[i].y) {
            return true;
        }
    }
    return false;
}

function handleGameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    finalScoreElement.textContent = score;
    gameOverOverlay.style.display = 'flex';
}

function restartGame() {
    snake = [{ x: 10, y: 10 }];
    velocityX = 0;
    velocityY = 0;
    score = 0;
    // Reset to user defined start speed
    gameSpeed = settings.startSpeed;
    isGameOver = false;
    scoreElement.textContent = score;
    placeFood();
    gameOverOverlay.style.display = 'none';
    startGame();
}

// --- Settings Management ---

function openSettings() {
    isPaused = true;
    settingsOverlay.style.display = 'flex';
}

function saveSettings() {
    settings.snakeColor = snakeColorInput.value;
    settings.foodColor = foodColorInput.value;
    settings.bgColor = bgColorInput.value;
    settings.startSpeed = parseInt(speedSlider.value);

    localStorage.setItem('snakeColor', settings.snakeColor);
    localStorage.setItem('foodColor', settings.foodColor);
    localStorage.setItem('bgColor', settings.bgColor);
    localStorage.setItem('startSpeed', settings.startSpeed);

    settingsOverlay.style.display = 'none';
    
    // Apply speed immediately
    gameSpeed = settings.startSpeed;
    clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);

    isPaused = false;
    if (!isGameOver) draw();
}

// --- Controls ---

document.addEventListener('keydown', (e) => {
    if(isPaused) return;

    switch(e.key) {
        case 'ArrowUp': case 'w': case 'W':
            if (velocityY !== 1) { velocityX = 0; velocityY = -1; }
            break;
        case 'ArrowDown': case 's': case 'S':
            if (velocityY !== -1) { velocityX = 0; velocityY = 1; }
            break;
        case 'ArrowLeft': case 'a': case 'A':
            if (velocityX !== 1) { velocityX = -1; velocityY = 0; }
            break;
        case 'ArrowRight': case 'd': case 'D':
            if (velocityX !== -1) { velocityX = 1; velocityY = 0; }
            break;
    }
});

// Start Game
draw();
startGame();