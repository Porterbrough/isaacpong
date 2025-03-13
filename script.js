// Wait for the window to fully load
window.onload = function() {
    // Get the canvas and context
    const canvas = document.getElementById('pong');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('start-btn');
    const modeBtn = document.getElementById('mode-btn');
    const computerBtn = document.getElementById('computer-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const exitBtn = document.getElementById('exit-btn');
    
    // Game difficulty buttons
    const gameEasyBtn = document.getElementById('game-easy-btn');
    const gameMediumBtn = document.getElementById('game-medium-btn');
    const gameHardBtn = document.getElementById('game-hard-btn');
    
    // Computer difficulty buttons
    const compEasyBtn = document.getElementById('comp-easy-btn');
    const compMediumBtn = document.getElementById('comp-medium-btn');
    const compHardBtn = document.getElementById('comp-hard-btn');
    
    const scoreDisplay = document.getElementById('score');
    const controlsText = document.getElementById('controls-text');
    
    // Game mode (1 = one player, 2 = two players, 3 = computer player)
    let gameMode = 1;
    
    // Difficulty level (1 = easy, 2 = medium, 3 = hard)
    let difficultyLevel = 1; // Default to easy
    
    // Computer player settings
    const computerPlayer = {
        active: false,
        difficultyLevel: 1, // 1 = easy, 2 = medium, 3 = hard
        reactionTime: 100,  // ms delay in AI reaction (higher = slower responses)
        accuracy: 0.7,      // 0-1, chance of moving correctly (lower = makes more mistakes)
        lastUpdate: 0,      // timestamp of last decision
        speedMultiplier: 0.8 // Makes the computer paddle move slower than human
    };
    
    // List of emojis for the ball
    const emojis = [
        '😀', '😎', '🚀', '🔥', '⚽', '🏀', '🎾', '🌍', 
        '🍎', '🍕', '🎮', '🎈', '⭐', '💡', '🦄', '🐱', 
        '🐶', '🐢', '🦋', '🍄', '🌈', '💎', '🥳', '🤖'
    ];
    
    // Game objects
    // Create an array to hold multiple balls
    const balls = [];
    
    // Function to create a ball object
    function createBall() {
        return {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 40, // Start with a 40 pixel radius (80 pixel diameter)
            velocityX: 5,
            velocityY: 5,
            speed: 7,
            initialSpeed: {
                onePlayer: 7,
                twoPlayer: 4  // Slower initial speed for 2-player mode
            },
            color: 'white',
            initialRadius: 40, // Store the initial radius
            finalRadius: 20,   // The minimum radius after shrinking (20 pixels less than initial)
            hitCount: 0,       // Track number of hits
            maxHits: 20,       // Maximum number of hits for shrinking
            trail: [],         // Array to store previous positions for the trail
            emoji: null        // Each ball can have its own emoji
        };
    }
    
    // Create the first ball
    balls.push(createBall());
    
    // For convenience, reference the first ball as 'ball' for now
    // (We'll update the code to handle multiple balls later)
    let ball = balls[0];

    const player1 = {
        x: 0,  // Back to the edge
        y: (canvas.height - 100) / 2,
        width: 10,  // Original width
        height: 100,
        score: 0,
        color: 'white',  // Simple white color
        speed: 8
    };

    const player2 = {
        x: canvas.width - 10,  // Back to the edge
        y: (canvas.height - 100) / 2,
        width: 10,  // Original width
        height: 100,
        score: 0,
        color: 'white',  // Simple white color
        speed: 8
    };
    
    // Wall for 1-player mode (takes place of player2)
    const wall = {
        x: canvas.width - 10,
        y: 0,
        width: 10,
        height: canvas.height,
        score: 0,
        color: 'white'
    };

// Game variables
let gameRunning = false;
let gamePaused = false;
let keysPressed = {};
let currentEmoji = null; // Will be set when the game loads
let initialEmoji = null; // Store the initial emoji shown before game starts
let gameOver = false;
let gameOverMessage = "";
let lastSpeedIncreaseTime = 0; // Track when we last increased speed
let consecutivePoints = 0; // Track consecutive points in Easy mode
let speedBoosted = false; // Track if speed boost has been applied

// Event listeners
window.addEventListener('keydown', function(e) {
    keysPressed[e.key] = true;
    
    // Handle pause key (Space or 'p')
    if ((e.key === ' ' || e.key === 'p' || e.key === 'P') && gameRunning) {
        // Simulate a click on the pause button
        pauseBtn.click();
    }
    
    // Handle exit key (Escape)
    if (e.key === 'Escape') {
        // Exit immediately without confirmation
        gameRunning = false;
        gamePaused = false;
        
        // Reset buttons
        pauseBtn.textContent = '⏸️ Pause';
        pauseBtn.classList.remove('resume');
        startBtn.textContent = 'Start Game';
        
        // Reset scores and game objects
        resetGame();
        
        // Show exit message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '48px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME EXITED', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '20px Arial';
        ctx.fillText('Click "Start Game" to play again', canvas.width / 2, canvas.height / 2 + 50);
        
        // Render once to show the exit message
        render();
    }
});

window.addEventListener('keyup', function(e) {
    keysPressed[e.key] = false;
});

startBtn.addEventListener('click', function() {
    if (!gameRunning) {
        resetGame();
        gameRunning = true;
        gamePaused = false; // Make sure game isn't paused
        pauseBtn.textContent = '⏸️ Pause';
        pauseBtn.classList.remove('resume');
        startBtn.textContent = 'Restart Game';
        // Initialize the speed increase timer when the game starts
        lastSpeedIncreaseTime = Date.now();
        gameLoop();
    } else {
        resetGame();
        gamePaused = false; // Make sure game isn't paused when restarting
        pauseBtn.textContent = '⏸️ Pause';
        pauseBtn.classList.remove('resume');
    }
});

modeBtn.addEventListener('click', function() {
    if (gameRunning) {
        // Can't change mode during game
        return;
    }
    
    // Turn off computer player mode
    computerPlayer.active = false;
    
    // Toggle between 1-player and 2-player modes
    gameMode = gameMode === 1 ? 2 : 1;
    
    // Update button text and instructions
    if (gameMode === 1) {
        modeBtn.textContent = 'Switch to 2-Player';
        computerBtn.textContent = 'Computer Player';
        controlsText.textContent = 'Move paddle: W/S keys or Arrow Up/Down keys';
    } else {
        modeBtn.textContent = 'Switch to 1-Player';
        computerBtn.textContent = 'Computer Player';
        controlsText.textContent = 'Player 1: W/S keys | Player 2: Arrow Up/Down keys';
    }
    
    // Reset scores and positions 
    player1.score = 0;
    player2.score = 0;
    wall.score = 0;
    player1.y = (canvas.height - player1.height) / 2;
    player2.y = (canvas.height - player2.height) / 2;
    
    // Reset ball position but don't start the game
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.radius = ball.initialRadius;
    ball.hitCount = 0;
    ball.speed = gameMode === 1 ? ball.initialSpeed.onePlayer : ball.initialSpeed.twoPlayer;
    
    // Update score display
    updateScore();
    
    // Render the game with the new mode
    render();
});

// Computer player button event listener
computerBtn.addEventListener('click', function() {
    if (gameRunning) {
        // Can't change mode during game
        return;
    }
    
    // Toggle between computer player and human player
    computerPlayer.active = !computerPlayer.active;
    
    if (computerPlayer.active) {
        // Always set to 2-player mode when computer player is active
        gameMode = 2;
        modeBtn.textContent = 'Switch to 1-Player';
        computerBtn.textContent = 'Human Player';
        controlsText.textContent = 'Move paddle: W/S keys or Arrow Up/Down keys | Player 2: Computer AI';
        
        // Highlight the currently active computer difficulty button
        updateComputerDifficultyButtons();
    } else {
        // Switch back to human player
        computerBtn.textContent = 'Computer Player';
        controlsText.textContent = 'Player 1: W/S keys | Player 2: Arrow Up/Down keys';
        
        // Remove highlighting from all computer difficulty buttons
        compEasyBtn.classList.remove('active');
        compMediumBtn.classList.remove('active');
        compHardBtn.classList.remove('active');
    }
    
    // Reset scores and positions
    player1.score = 0;
    player2.score = 0;
    player1.y = (canvas.height - player1.height) / 2;
    player2.y = (canvas.height - player2.height) / 2;
    
    // Reset ball position but don't start the game
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.radius = ball.initialRadius;
    ball.hitCount = 0;
    ball.speed = ball.initialSpeed.twoPlayer;
    
    // Update score display
    updateScore();
    
    // Render the game with the new mode
    render();
});

// Helper function to set computer difficulty parameters
function setComputerDifficulty(level) {
    computerPlayer.difficultyLevel = level;
    
    switch (level) {
        case 1: // Easy
            computerPlayer.reactionTime = 180;
            computerPlayer.accuracy = 0.5;
            computerPlayer.speedMultiplier = 0.6;
            break;
        case 2: // Medium
            computerPlayer.reactionTime = 80;
            computerPlayer.accuracy = 0.75;
            computerPlayer.speedMultiplier = 1.0;
            break;
        case 3: // Hard
            computerPlayer.reactionTime = 40;
            computerPlayer.accuracy = 0.9;
            computerPlayer.speedMultiplier = 1.5;
            break;
    }
    
    // Update the difficulty button highlights
    updateComputerDifficultyButtons();
}

// Helper function to update the computer difficulty button highlighting
function updateComputerDifficultyButtons() {
    if (!computerPlayer.active) return;
    
    // Remove active class from all buttons
    compEasyBtn.classList.remove('active');
    compMediumBtn.classList.remove('active');
    compHardBtn.classList.remove('active');
    
    // Add active class to the current difficulty button
    if (computerPlayer.difficultyLevel === 1) {
        compEasyBtn.classList.add('active');
    } else if (computerPlayer.difficultyLevel === 2) {
        compMediumBtn.classList.add('active');
    } else {
        compHardBtn.classList.add('active');
    }
}

// Game difficulty button event listeners
gameEasyBtn.addEventListener('click', function() {
    if (gameRunning) {
        // Can't change difficulty during game
        return;
    }
    
    difficultyLevel = 1;
    consecutivePoints = 0;
    speedBoosted = false;
    
    resetGame();
    render();
});

gameMediumBtn.addEventListener('click', function() {
    if (gameRunning) {
        // Can't change difficulty during game
        return;
    }
    
    difficultyLevel = 2;
    consecutivePoints = 0;
    speedBoosted = false;
    
    resetGame();
    render();
});

gameHardBtn.addEventListener('click', function() {
    if (gameRunning) {
        // Can't change difficulty during game
        return;
    }
    
    difficultyLevel = 3;
    consecutivePoints = 0;
    speedBoosted = false;
    
    resetGame();
    render();
});

// Computer difficulty button event listeners
compEasyBtn.addEventListener('click', function() {
    if (gameRunning) {
        // Can't change difficulty during game
        return;
    }
    
    // Set computer difficulty to easy
    setComputerDifficulty(1);
    
    // If computer wasn't active, activate it
    if (!computerPlayer.active) {
        computerPlayer.active = true;
        gameMode = 2;
        modeBtn.textContent = 'Switch to 1-Player';
        computerBtn.textContent = 'Human Player';
        controlsText.textContent = 'Move paddle: W/S keys or Arrow Up/Down keys | Player 2: Computer AI';
        resetGame();
    }
    
    render();
});

compMediumBtn.addEventListener('click', function() {
    if (gameRunning) {
        // Can't change difficulty during game
        return;
    }
    
    // Set computer difficulty to medium
    setComputerDifficulty(2);
    
    // If computer wasn't active, activate it
    if (!computerPlayer.active) {
        computerPlayer.active = true;
        gameMode = 2;
        modeBtn.textContent = 'Switch to 1-Player';
        computerBtn.textContent = 'Human Player';
        controlsText.textContent = 'Move paddle: W/S keys or Arrow Up/Down keys | Player 2: Computer AI';
        resetGame();
    }
    
    render();
});

compHardBtn.addEventListener('click', function() {
    if (gameRunning) {
        // Can't change difficulty during game
        return;
    }
    
    // Set computer difficulty to hard
    setComputerDifficulty(3);
    
    // If computer wasn't active, activate it
    if (!computerPlayer.active) {
        computerPlayer.active = true;
        gameMode = 2;
        modeBtn.textContent = 'Switch to 1-Player';
        computerBtn.textContent = 'Human Player';
        controlsText.textContent = 'Move paddle: W/S keys or Arrow Up/Down keys | Player 2: Computer AI';
        resetGame();
    }
    
    render();
});

// Pause button event listener
pauseBtn.addEventListener('click', function() {
    if (!gameRunning) {
        // Can't pause if game isn't running
        return;
    }
    
    // Toggle pause state
    gamePaused = !gamePaused;
    
    // Update button text based on pause state
    if (gamePaused) {
        pauseBtn.textContent = '▶️ Resume';
        pauseBtn.classList.add('resume');
        
        // Display "PAUSED" overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '48px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    } else {
        pauseBtn.textContent = '⏸️ Pause';
        pauseBtn.classList.remove('resume');
        
        // Resume the game
        lastSpeedIncreaseTime = Date.now(); // Reset speed increase timer
    }
});

// Exit button event listener
exitBtn.addEventListener('click', function() {
    // No confirmation dialog - exit immediately
    
    // Stop the game
    gameRunning = false;
    gamePaused = false;
    
    // Reset buttons
    pauseBtn.textContent = '⏸️ Pause';
    pauseBtn.classList.remove('resume');
    startBtn.textContent = 'Start Game';
    
    // Reset scores and game objects
    resetGame();
    
    // Show exit message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '48px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME EXITED', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '20px Arial';
    ctx.fillText('Click "Start Game" to play again', canvas.width / 2, canvas.height / 2 + 50);
    
    // Render once to show the exit message
    render();
});

// Game functions
function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawPaddle(player) {
    const isLeftPaddle = player.x < canvas.width / 2;
    
    // Draw a simple oval paddle
    ctx.fillStyle = player.paddleColor;
    
    // Save the current context state
    ctx.save();
    
    // Move the origin to the center of the paddle
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    // Create the oval/circle shape for the paddle
    ctx.beginPath();
    ctx.ellipse(0, 0, player.width, player.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add rubber texture (different color for each player)
    const rubberColor = isLeftPaddle ? '#D32F2F' : '#1976D2'; // Red for player 1, Blue for player 2
    ctx.fillStyle = rubberColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, player.width - 4, player.height / 2 - 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw handle (as a rectangle from the paddle)
    const handleWidth = 8;
    const handleLength = player.height * 0.8;
    
    // Handle position depends on which side
    const handleX = isLeftPaddle ? -player.width - handleWidth / 2 : player.width - handleWidth / 2;
    const handleY = -handleLength / 2;
    
    // Draw handle base
    ctx.fillStyle = '#8D6E63';  // Wood color
    ctx.fillRect(handleX, handleY, handleWidth, handleLength);
    
    // Add handle outline
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 1;
    ctx.strokeRect(handleX, handleY, handleWidth, handleLength);
    
    // Add grip texture
    for (let y = handleY + 10; y < handleY + handleLength - 10; y += 10) {
        ctx.beginPath();
        ctx.moveTo(handleX, y);
        ctx.lineTo(handleX + handleWidth, y);
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // Restore the context state
    ctx.restore();
}

function drawCircle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
}

function drawEmoji(x, y, emoji, radius) {
    if (!emoji) {
        console.error("No emoji provided to drawEmoji function");
        emoji = '😀'; // Fallback emoji
    }
    
    // Scale the emoji size based on the provided radius or default to a standard size
    // Use a larger font size to make the emoji more visible/clickable
    const fontSize = Math.max(20, radius * 1.5);
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = "white"; // Ensure we have a fill color
    ctx.fillText(emoji, x, y);
    
    // Uncomment this to debug the hitbox
    // drawCircle(x, y, radius * 0.6, 'rgba(255, 0, 0, 0.3)');
}

function drawNet() {
    for (let i = 0; i < canvas.height; i += 15) {
        drawRect(canvas.width / 2 - 1, i, 2, 10, 'white');
    }
}

function resetBall(ballObj) {
    ballObj.x = canvas.width / 2;
    ballObj.y = canvas.height / 2;
    
    // Set the appropriate base speed based on game mode
    let baseSpeed;
    if (gameMode === 1) {
        baseSpeed = ballObj.initialSpeed.onePlayer;
    } else {
        baseSpeed = ballObj.initialSpeed.twoPlayer;
    }
    
    // Apply difficulty modifier to speed
    if (difficultyLevel === 3) { // Hard mode: 1.5x faster
        baseSpeed *= 1.5;
    }
    
    ballObj.speed = baseSpeed;
    
    // Give the ball a random initial direction with moderate velocity
    const direction = Math.random() > 0.5 ? 1 : -1;
    ballObj.velocityX = direction * (ballObj.speed * 0.7);
    
    // Random but smaller vertical velocity
    ballObj.velocityY = (Math.random() * 2 - 1) * (ballObj.speed * 0.3);
    
    // Clear the trail when resetting the ball
    ballObj.trail = [];
    
    // Assign a random emoji to the ball if it doesn't have one
    if (!ballObj.emoji) {
        ballObj.emoji = emojis[Math.floor(Math.random() * emojis.length)];
    }
}

function resetGame() {
    // Reset scores
    player1.score = 0;
    player2.score = 0;
    wall.score = 0;
    
    // Reset paddle positions
    player1.y = (canvas.height - player1.height) / 2;
    player2.y = (canvas.height - player2.height) / 2;
    
    // Clear existing balls
    balls.length = 0;
    
    // Add balls based on difficulty
    const ballCount = (difficultyLevel === 1) ? 1 : 2; // 1 ball for easy, 2 for medium/hard
    
    for (let i = 0; i < ballCount; i++) {
        const newBall = createBall();
        
        // Give each ball a different emoji
        let newEmoji;
        do {
            newEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        } while (balls.some(b => b.emoji === newEmoji) && emojis.length > balls.length);
        
        newBall.emoji = newEmoji;
        
        // Apply the hard mode speed boost if needed
        if (difficultyLevel === 3) {
            newBall.initialSpeed.onePlayer *= 1.5;
            newBall.initialSpeed.twoPlayer *= 1.5;
        }
        
        resetBall(newBall);
        balls.push(newBall);
    }
    
    // Update our reference to the first ball for backward compatibility
    ball = balls[0];
    currentEmoji = ball.emoji;
    
    // Reset speed increase timer
    lastSpeedIncreaseTime = Date.now();
    
    // Reset consecutivePoints counter and speedBoosted flag
    consecutivePoints = 0;
    speedBoosted = false;
    
    // Reset game over state
    gameOver = false;
    gameOverMessage = "";
    
    updateScore();
}

function updateScore() {
    if (gameMode === 1) {
        // 1-player mode
        scoreDisplay.textContent = player1.score + ' : ' + wall.score;
        
        // Check win conditions for 1-player mode
        if (player1.score >= 20) {
            gameRunning = false;
            gameOver = true;
            gameOverMessage = "YOU WIN";
            startBtn.textContent = 'Play Again';
            // Reset pause button
            gamePaused = false;
            pauseBtn.textContent = '⏸️ Pause';
            pauseBtn.classList.remove('resume');
        } else if (wall.score >= 20) {
            gameRunning = false;
            gameOver = true;
            gameOverMessage = "YOU LOSE";
            startBtn.textContent = 'Play Again';
            // Reset pause button
            gamePaused = false;
            pauseBtn.textContent = '⏸️ Pause';
            pauseBtn.classList.remove('resume');
        }
    } else {
        // 2-player mode
        scoreDisplay.textContent = player1.score + ' : ' + player2.score;
        
        // Check win conditions for 2-player mode
        if (player1.score >= 20) {
            gameRunning = false;
            gameOver = true;
            gameOverMessage = "PLAYER 1 WINS";
            startBtn.textContent = 'Play Again';
            // Reset pause button
            gamePaused = false;
            pauseBtn.textContent = '⏸️ Pause';
            pauseBtn.classList.remove('resume');
        } else if (player2.score >= 20) {
            gameRunning = false;
            gameOver = true;
            gameOverMessage = "PLAYER 2 WINS";
            startBtn.textContent = 'Play Again';
            // Reset pause button
            gamePaused = false;
            pauseBtn.textContent = '⏸️ Pause';
            pauseBtn.classList.remove('resume');
        }
    }
}

function displayGameOver(message) {
    // Display game over message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '60px Arial';
    ctx.fillStyle = message === "YOU WIN" ? '#00FF00' : '#FF0000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Click "Play Again" to restart', canvas.width / 2, canvas.height / 2 + 50);
}

function collision(ball, player) {
    // Add a small buffer to make collision more generous
    const collisionBuffer = 5;
    
    const playerTop = player.y;
    const playerBottom = player.y + player.height;
    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    
    // Use a smaller collision area for the ball to match the visible emoji better
    // Most emojis visually appear smaller than their actual box
    const effectiveRadius = ball.radius * 0.6;
    
    const ballTop = ball.y - effectiveRadius;
    const ballBottom = ball.y + effectiveRadius;
    const ballLeft = ball.x - effectiveRadius;
    const ballRight = ball.x + effectiveRadius;
    
    // More generous collision detection with buffer
    return (ballRight + collisionBuffer) > playerLeft && 
           (ballLeft - collisionBuffer) < playerRight && 
           (ballBottom + collisionBuffer) > playerTop && 
           (ballTop - collisionBuffer) < playerBottom;
}

function movePlayers() {
    // Player 1 controls - always allow W/S keys
    if (keysPressed['w'] || keysPressed['W']) {
        player1.y = Math.max(0, player1.y - player1.speed);
    }
    if (keysPressed['s'] || keysPressed['S']) {
        player1.y = Math.min(canvas.height - player1.height, player1.y + player1.speed);
    }
    
    // Check if computer player is active
    if (computerPlayer.active && gameMode === 2) {
        // Computer player logic for player 2
        moveComputerPlayer();
        
        // In computer mode, allow arrow keys to also control player 1 (for convenience)
        if (keysPressed['ArrowUp']) {
            player1.y = Math.max(0, player1.y - player1.speed);
        }
        if (keysPressed['ArrowDown']) {
            player1.y = Math.min(canvas.height - player1.height, player1.y + player1.speed);
        }
    } else {
        // Arrow keys behavior depends on game mode
        if (gameMode === 1) {
            // In 1-player mode, arrow keys also control player 1 (for convenience)
            if (keysPressed['ArrowUp']) {
                player1.y = Math.max(0, player1.y - player1.speed);
            }
            if (keysPressed['ArrowDown']) {
                player1.y = Math.min(canvas.height - player1.height, player1.y + player1.speed);
            }
        } else {
            // In 2-player mode, arrow keys control player 2
            if (keysPressed['ArrowUp']) {
                player2.y = Math.max(0, player2.y - player2.speed);
            }
            if (keysPressed['ArrowDown']) {
                player2.y = Math.min(canvas.height - player2.height, player2.y + player2.speed);
            }
        }
    }
}

function moveComputerPlayer() {
    // Don't update AI too frequently to make it more human-like
    const currentTime = Date.now();
    if (currentTime - computerPlayer.lastUpdate < computerPlayer.reactionTime) {
        return;
    }
    
    computerPlayer.lastUpdate = currentTime;
    
    // Find the ball that's closest to the player 2 paddle
    let closestBall = null;
    let shortestDistance = Infinity;
    
    for (let i = 0; i < balls.length; i++) {
        const ballObj = balls[i];
        // Consider all balls with emphasis on those moving toward player 2
        const distance = player2.x - ballObj.x;
        
        // Weight balls moving toward player 2 (positive velocityX) more heavily
        const weightedDistance = ballObj.velocityX > 0 ? 
                                distance : 
                                distance * 3; // Lower priority for balls moving away
        
        if (weightedDistance > 0 && weightedDistance < shortestDistance) {
            shortestDistance = weightedDistance;
            closestBall = ballObj;
        }
    }
    
    // If no valid ball found, move toward center
    if (!closestBall) {
        const centerY = canvas.height / 2;
        if (player2.y + player2.height / 2 < centerY - player2.speed) {
            player2.y += player2.speed;
        } else if (player2.y + player2.height / 2 > centerY + player2.speed) {
            player2.y -= player2.speed;
        }
        return;
    }
    
    // Predict where the ball will be when it reaches the paddle's x position
    let predictedY = closestBall.y;
    
    if (closestBall.velocityX > 0) {
        // Only predict for balls moving toward the paddle
        const timeToReachPaddle = (player2.x - closestBall.x) / closestBall.velocityX;
        predictedY = closestBall.y + (closestBall.velocityY * timeToReachPaddle);
        
        // Reduce bounce prediction accuracy based on computer difficulty level
        if (computerPlayer.difficultyLevel < 3) {
            // In Easy and Medium computer modes, the AI is worse at predicting bounces
            if (predictedY < 0 || predictedY > canvas.height) {
                // Just move toward the ball's current position instead of predicting bounces
                predictedY = closestBall.y + (Math.random() - 0.5) * (computerPlayer.difficultyLevel === 1 ? 80 : 40);
            }
        } else {
            // Only in Hard computer mode does the AI predict bounces with some accuracy
            while (predictedY < 0 || predictedY > canvas.height) {
                if (predictedY < 0) {
                    predictedY = -predictedY; // Bounce off top wall
                } else if (predictedY > canvas.height) {
                    predictedY = 2 * canvas.height - predictedY; // Bounce off bottom wall
                }
                
                // Add some error to the prediction
                predictedY += (Math.random() - 0.5) * 25;
            }
        }
    }
    
    // Calculate ideal position for paddle center (aligned with predicted ball position)
    const idealPaddleY = predictedY - player2.height / 2;
    
    // Add more randomness and mistakes to AI positioning
    let moveToY = idealPaddleY;
    
    // Always add some imprecision, more when accuracy is lower
    const randomOffset = (Math.random() - 0.5) * player2.height * (1.2 - computerPlayer.accuracy);
    moveToY += randomOffset;
    
    // Occasionally make bigger mistakes
    if (Math.random() > computerPlayer.accuracy) {
        // Make a significant mistake by moving in wrong direction
        moveToY = predictedY + (Math.random() - 0.5) * player2.height * 2;
    }
    
    // Sometimes get distracted and move toward center instead
    if (Math.random() > computerPlayer.accuracy + 0.2) {
        moveToY = canvas.height / 2 - player2.height / 2;
    }
    
    // Move the paddle toward the calculated position
    const distanceToMove = moveToY - player2.y;
    
    // Apply computer speed multiplier based on computer difficulty
    let aiSpeed = player2.speed * computerPlayer.speedMultiplier;
    
    // Move the paddle with some delay (for human-like behavior)
    if (Math.abs(distanceToMove) > aiSpeed) {
        player2.y += Math.sign(distanceToMove) * aiSpeed;
    } else {
        player2.y = moveToY;
    }
    
    // Keep paddle within canvas boundaries
    player2.y = Math.max(0, Math.min(canvas.height - player2.height, player2.y));
}

function updateBall(ballObj) {
    // Add current position to the trail (less frequently for better spacing)
    if (ballObj.trail.length === 0 || 
        Math.abs(ballObj.x - ballObj.trail[ballObj.trail.length-1].x) > ballObj.radius * 0.3 || 
        Math.abs(ballObj.y - ballObj.trail[ballObj.trail.length-1].y) > ballObj.radius * 0.3) {
        ballObj.trail.push({x: ballObj.x, y: ballObj.y, age: 10}); // Age represents how long the trail point will last
        
        // Limit trail length to avoid performance issues and keep trail reasonable
        if (ballObj.trail.length > 8) {
            ballObj.trail.shift(); // Remove oldest point
        }
    }
    
    // Update trail ages and remove old points
    for (let i = ballObj.trail.length - 1; i >= 0; i--) {
        ballObj.trail[i].age--;
        if (ballObj.trail[i].age <= 0) {
            ballObj.trail.splice(i, 1);
        }
    }
    
    // Move the ball
    ballObj.x += ballObj.velocityX;
    ballObj.y += ballObj.velocityY;
    
    // Wall collision (top and bottom)
    if (ballObj.y - ballObj.radius < 0 || ballObj.y + ballObj.radius > canvas.height) {
        // First, fix the ball position to prevent it from getting stuck in the wall
        if (ballObj.y - ballObj.radius < 0) {
            ballObj.y = ballObj.radius + 1;
        } else if (ballObj.y + ballObj.radius > canvas.height) {
            ballObj.y = canvas.height - ballObj.radius - 1;
        }
        
        // Reverse vertical direction with increased random adjustment
        ballObj.velocityY = -ballObj.velocityY;
        
        // Add a stronger random horizontal adjustment when hitting top/bottom walls
        ballObj.velocityX += (Math.random() - 0.5) * 3;
        
        // Ensure ball maintains significant horizontal movement
        if (Math.abs(ballObj.velocityX) < ballObj.speed * 0.7) {
            ballObj.velocityX = (ballObj.velocityX > 0 ? 1 : -1) * ballObj.speed * 0.7;
        }
    }
    
    // Player 1 paddle collision
    if (collision(ballObj, player1)) {
        // First, fix the ball position to prevent it from getting stuck in the paddle
        ballObj.x = player1.x + player1.width + ballObj.radius + 1;
        
        // Where the ball hit the paddle
        let collidePoint = ballObj.y - (player1.y + player1.height / 2);
        
        // Normalize the value (-1 to 1)
        collidePoint = collidePoint / (player1.height / 2);
        
        // Calculate angle in radians (limit to -40 to 40 degrees to prevent too vertical angles)
        let angleRad = collidePoint * (Math.PI / 4.5);
        
        // Always direct ball to the right after hitting player paddle
        let direction = 1;
        
        // Ensure a minimum horizontal velocity to prevent infinite loops
        const minHorizontalVelocity = ballObj.speed * 0.7;
        
        // Change velocity X and Y
        ballObj.velocityX = Math.max(minHorizontalVelocity, direction * ballObj.speed * Math.cos(angleRad));
        ballObj.velocityY = ballObj.speed * Math.sin(angleRad);
        
        // Add more randomness to the angle to prevent repetitive patterns
        ballObj.velocityY += (Math.random() - 0.5) * 3;
        
        // Ensure the ball has some vertical movement
        if (Math.abs(ballObj.velocityY) < 2) {
            ballObj.velocityY = (Math.random() > 0.5 ? 2 : -2);
        }
        
        // Player 1 scores in 1-player mode only
        if (gameMode === 1) {
            player1.score++;
            
            // Track consecutive points in Easy mode
            if (difficultyLevel === 1) {
                consecutivePoints++;
                
                // Check if player reached 5 consecutive points and apply speed boost
                if (consecutivePoints >= 5 && !speedBoosted) {
                    // Apply 1.5x speed boost to all balls
                    for (let i = 0; i < balls.length; i++) {
                        balls[i].speed *= 1.5;
                        // Update velocities proportionally
                        balls[i].velocityX *= 1.5;
                        balls[i].velocityY *= 1.5;
                    }
                    speedBoosted = true;
                    // No visual message - silent speed increase
                }
            }
            
            updateScore();
            
            // Increment hit count and shrink the ball by 1 pixel each hit, up to 20 pixels total
            if (ballObj.hitCount < ballObj.maxHits) {
                ballObj.hitCount++;
                ballObj.radius = ballObj.initialRadius - ballObj.hitCount;
            }
        }
    }
    
    // Right side collision handling
    if (gameMode === 1) {
        // 1-player mode: Wall collision
        // Use a smaller effective radius for the wall collision too
        if (ballObj.x + (ballObj.radius * 0.6) > wall.x) {
            // Fix the ball position to prevent it from getting stuck in the wall
            ballObj.x = wall.x - ballObj.radius - 1;
            
            // Ensure the ball bounces back with significant horizontal velocity
            ballObj.velocityX = -Math.abs(ballObj.velocityX) * 1.1;
            
            // Add sufficient randomness to the bounce to prevent predictable patterns
            ballObj.velocityY += (Math.random() - 0.5) * 4;
            
            // Make sure the ball has some vertical movement
            if (Math.abs(ballObj.velocityY) < 2) {
                ballObj.velocityY = (Math.random() > 0.5 ? 2 : -2);
            }
        }
    } else {
        // 2-player mode: Player 2 paddle collision
        if (collision(ballObj, player2)) {
            // Fix the ball position to prevent it from getting stuck in the paddle
            ballObj.x = player2.x - ballObj.radius - 1;
            
            // Where the ball hit the paddle
            let collidePoint = ballObj.y - (player2.y + player2.height / 2);
            
            // Normalize the value (-1 to 1)
            collidePoint = collidePoint / (player2.height / 2);
            
            // Calculate angle in radians (limit to -40 to 40 degrees to prevent too vertical angles)
            let angleRad = collidePoint * (Math.PI / 4.5);
            
            // Always direct ball to the left after hitting player 2 paddle
            let direction = -1;
            
            // Ensure a minimum horizontal velocity to prevent infinite loops
            const minHorizontalVelocity = ballObj.speed * 0.7;
            
            // Change velocity X and Y
            ballObj.velocityX = Math.min(-minHorizontalVelocity, direction * ballObj.speed * Math.cos(angleRad));
            ballObj.velocityY = ballObj.speed * Math.sin(angleRad);
            
            // Add randomness to the angle to prevent repetitive patterns
            ballObj.velocityY += (Math.random() - 0.5) * 3;
            
            // Ensure the ball has some vertical movement
            if (Math.abs(ballObj.velocityY) < 2) {
                ballObj.velocityY = (Math.random() > 0.5 ? 2 : -2);
            }
        }
        
        // Player 2 scores when player 1 misses
        if (ballObj.x - (ballObj.radius * 0.6) < 0) {
            player2.score++;
            updateScore();
            resetBall(ballObj);
        }
        
        // Player 1 scores when player 2 misses
        if (ballObj.x + (ballObj.radius * 0.6) > canvas.width) {
            player1.score++;
            updateScore();
            resetBall(ballObj);
            
            // Shrink the ball in 2-player mode as well
            if (ballObj.hitCount < ballObj.maxHits) {
                ballObj.hitCount++;
                ballObj.radius = ballObj.initialRadius - ballObj.hitCount;
            }
        }
    }
    
    // Player 1 misses the ball in 1-player mode
    if (gameMode === 1 && ballObj.x - (ballObj.radius * 0.6) < 0) {
        // Wall scores 3 points every time it hits player's wall
        wall.score += 3;
        updateScore();
        resetBall(ballObj);
        
        // In Easy mode, reset consecutive points when player misses
        if (difficultyLevel === 1) {
            consecutivePoints = 0;
            // Note: We don't reset the speed boost once it's applied
        }
    }
}

function update() {
    if (!gameRunning) return;
    
    // Move the players
    movePlayers();
    
    // Check if it's time to increase the ball speed (every 3 seconds)
    const currentTime = Date.now();
    if (currentTime - lastSpeedIncreaseTime > 3000) { // 3000ms = 3 seconds
        // Increase ball speed for all balls
        for (let i = 0; i < balls.length; i++) {
            const ballObj = balls[i];
            
            // Increase ball speed based on game mode and difficulty
            let speedIncrease;
            if (gameMode === 1) {
                // 1-player mode: Faster speed increases
                speedIncrease = difficultyLevel === 3 ? 7.5 : 5; // 1.5x for hard mode
            } else {
                // 2-player mode: More gradual speed increases
                speedIncrease = difficultyLevel === 3 ? 3 : 2; // 1.5x for hard mode
            }
            
            ballObj.speed += speedIncrease;
            
            // Update velocity based on the new speed while maintaining direction
            if (ballObj.velocityX !== 0) {
                const directionX = ballObj.velocityX > 0 ? 1 : -1;
                const directionY = ballObj.velocityY > 0 ? 1 : -1;
                const magnitude = Math.sqrt(ballObj.velocityX * ballObj.velocityX + ballObj.velocityY * ballObj.velocityY);
                const ratio = ballObj.speed / magnitude;
                
                ballObj.velocityX = directionX * Math.abs(ballObj.velocityX) * ratio;
                ballObj.velocityY = directionY * Math.abs(ballObj.velocityY) * ratio;
            }
        }
        
        lastSpeedIncreaseTime = currentTime;
    }
    
    // Update each ball
    for (let i = 0; i < balls.length; i++) {
        updateBall(balls[i]);
    }
}

function renderBall(ballObj) {
    // Draw trail of fading emojis
    if (ballObj.emoji) { // Only draw if we have an emoji
        for (let i = 0; i < ballObj.trail.length; i++) {
            const point = ballObj.trail[i];
            const alpha = point.age / 10; // Fade based on age
            
            // Main emoji font size
            const mainFontSize = ballObj.radius * 1.5;
            
            // Each trail emoji is just 2 pixels smaller than the one in front
            const fontSize = mainFontSize - (2 * (ballObj.trail.length - i));
            
            // Don't draw if too small
            if (fontSize < 15) continue;
            
            // Draw smaller fading emojis
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = "white"; // Ensure we have a fill color
            ctx.fillText(ballObj.emoji, point.x, point.y);
            ctx.restore(); // Restore previous context state
        }
    }
    
    // Draw ball (using emoji)
    drawEmoji(ballObj.x, ballObj.y, ballObj.emoji, ballObj.radius);
}

function render() {
    // Clear canvas
    drawRect(0, 0, canvas.width, canvas.height, '#000');
    
    // Draw net (center line)
    drawNet();
    
    // Draw player 1 paddle
    drawRect(player1.x, player1.y, player1.width, player1.height, player1.color);
    
    // Draw right side based on game mode
    if (gameMode === 1) {
        // 1-player mode: Draw wall
        drawRect(wall.x, wall.y, wall.width, wall.height, wall.color);
    } else {
        // 2-player mode: Draw player 2 paddle
        drawRect(player2.x, player2.y, player2.width, player2.height, player2.color);
    }
    
    // Draw all balls
    for (let i = 0; i < balls.length; i++) {
        renderBall(balls[i]);
    }
    
    // If game is over, display the message
    if (gameOver) {
        displayGameOver(gameOverMessage);
    }
    
    // If game is paused, show the pause overlay
    if (gamePaused && gameRunning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '48px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

function gameLoop() {
    if (gameRunning && !gamePaused) {
        update();
    }
    
    render(); // Always render, even when paused
    
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Initialize game
resetGame();

// Set default computer difficulty to match game difficulty
setComputerDifficulty(1);

// Hide computer difficulty buttons initially (they'll show when computer mode is active)
compEasyBtn.classList.remove('active');
compMediumBtn.classList.remove('active');
compHardBtn.classList.remove('active');

// Initial render
render();

// Debug logging
console.log("Game initialized with difficulty level:", difficultyLevel);
    
}; // End of window.onload function