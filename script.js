// Wait for the window to fully load
window.onload = function() {
    // Get the canvas and context
    const canvas = document.getElementById('pong');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('start-btn');
    const modeBtn = document.getElementById('mode-btn');
    const scoreDisplay = document.getElementById('score');
    const controlsText = document.getElementById('controls-text');
    
    // Game mode (1 = one player, 2 = two players)
    let gameMode = 1;

    // List of emojis for the ball
    const emojis = [
        '😀', '😎', '🚀', '🔥', '⚽', '🏀', '🎾', '🌍', 
        '🍎', '🍕', '🎮', '🎈', '⭐', '💡', '🦄', '🐱', 
        '🐶', '🐢', '🦋', '🍄', '🌈', '💎', '🥳', '🤖'
    ];
    
    // Game objects
    const ball = {
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
        trail: []          // Array to store previous positions for the trail
    };

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
let keysPressed = {};
let currentEmoji = null; // Will be set when the game loads
let initialEmoji = null; // Store the initial emoji shown before game starts
let gameOver = false;
let gameOverMessage = "";
let lastSpeedIncreaseTime = 0; // Track when we last increased speed

// Event listeners
window.addEventListener('keydown', function(e) {
    keysPressed[e.key] = true;
});

window.addEventListener('keyup', function(e) {
    keysPressed[e.key] = false;
});

startBtn.addEventListener('click', function() {
    if (!gameRunning) {
        resetGame();
        gameRunning = true;
        startBtn.textContent = 'Restart Game';
        // Initialize the speed increase timer when the game starts
        lastSpeedIncreaseTime = Date.now();
        gameLoop();
    } else {
        resetGame();
    }
});

modeBtn.addEventListener('click', function() {
    if (gameRunning) {
        // Can't change mode during game
        return;
    }
    
    // Toggle game mode
    gameMode = gameMode === 1 ? 2 : 1;
    
    // Update button text and instructions
    if (gameMode === 1) {
        modeBtn.textContent = 'Switch to 2-Player';
        controlsText.textContent = 'Move paddle: W/S keys or Arrow Up/Down keys';
    } else {
        modeBtn.textContent = 'Switch to 1-Player';
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

function drawEmoji(x, y, emoji) {
    if (!emoji) {
        console.error("No emoji provided to drawEmoji function");
        emoji = '😀'; // Fallback emoji
    }
    
    // Scale the emoji size based on the ball radius
    // Use a larger font size to make the emoji more visible/clickable
    const fontSize = Math.max(20, ball.radius * 1.5);
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = "white"; // Ensure we have a fill color
    ctx.fillText(emoji, x, y);
    
    // Uncomment this to debug the hitbox
    // drawCircle(x, y, ball.radius * 0.6, 'rgba(255, 0, 0, 0.3)');
}

function drawNet() {
    for (let i = 0; i < canvas.height; i += 15) {
        drawRect(canvas.width / 2 - 1, i, 2, 10, 'white');
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    
    // Set the appropriate speed based on game mode
    if (gameMode === 1) {
        ball.speed = ball.initialSpeed.onePlayer;
    } else {
        ball.speed = ball.initialSpeed.twoPlayer;
    }
    
    // Give the ball a random initial direction with moderate velocity
    const direction = Math.random() > 0.5 ? 1 : -1;
    ball.velocityX = direction * (ball.speed * 0.7);
    
    // Random but smaller vertical velocity
    ball.velocityY = (Math.random() * 2 - 1) * (ball.speed * 0.3);
    
    // Clear the trail when resetting the ball
    ball.trail = [];
    
    // Note: we no longer change the emoji here
}

function resetGame() {
    // Reset scores
    player1.score = 0;
    player2.score = 0;
    wall.score = 0;
    
    // Reset paddle positions
    player1.y = (canvas.height - player1.height) / 2;
    player2.y = (canvas.height - player2.height) / 2;
    
    // Reset ball to its initial large size
    ball.radius = ball.initialRadius;
    ball.hitCount = 0;
    
    // Reset ball speed based on game mode
    ball.speed = gameMode === 1 ? ball.initialSpeed.onePlayer : ball.initialSpeed.twoPlayer;
    
    // Reset speed increase timer
    lastSpeedIncreaseTime = Date.now();
    
    // Reset game over state
    gameOver = false;
    gameOverMessage = "";
    
    resetBall();
    updateScore();
    
    // For the first game, keep the initial emoji
    // For subsequent games (restarts), change to a new random emoji
    if (gameRunning) {
        // Get a new emoji that's different from the current one
        let newEmoji;
        do {
            newEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        } while (newEmoji === currentEmoji && emojis.length > 1);
        
        currentEmoji = newEmoji;
    }
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
        } else if (wall.score >= 20) {
            gameRunning = false;
            gameOver = true;
            gameOverMessage = "YOU LOSE";
            startBtn.textContent = 'Play Again';
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
        } else if (player2.score >= 20) {
            gameRunning = false;
            gameOver = true;
            gameOverMessage = "PLAYER 2 WINS";
            startBtn.textContent = 'Play Again';
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

function update() {
    if (!gameRunning) return;
    
    // Move the players
    movePlayers();
    
    // Check if it's time to increase the ball speed (every 3 seconds)
    const currentTime = Date.now();
    if (currentTime - lastSpeedIncreaseTime > 3000) { // 3000ms = 3 seconds
        // Increase ball speed based on game mode
        if (gameMode === 1) {
            // 1-player mode: Faster speed increases
            ball.speed += 5;
        } else {
            // 2-player mode: More gradual speed increases
            ball.speed += 2;
        }
        
        // Update velocity based on the new speed while maintaining direction
        if (ball.velocityX !== 0) {
            const directionX = ball.velocityX > 0 ? 1 : -1;
            const directionY = ball.velocityY > 0 ? 1 : -1;
            const magnitude = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
            const ratio = ball.speed / magnitude;
            
            ball.velocityX = directionX * Math.abs(ball.velocityX) * ratio;
            ball.velocityY = directionY * Math.abs(ball.velocityY) * ratio;
        }
        
        lastSpeedIncreaseTime = currentTime;
    }
    
    // Add current position to the trail (less frequently for better spacing)
    if (ball.trail.length === 0 || 
        Math.abs(ball.x - ball.trail[ball.trail.length-1].x) > ball.radius * 0.3 || 
        Math.abs(ball.y - ball.trail[ball.trail.length-1].y) > ball.radius * 0.3) {
        ball.trail.push({x: ball.x, y: ball.y, age: 10}); // Age represents how long the trail point will last
        
        // Limit trail length to avoid performance issues and keep trail reasonable
        if (ball.trail.length > 8) {
            ball.trail.shift(); // Remove oldest point
        }
    }
    
    // Update trail ages and remove old points
    for (let i = ball.trail.length - 1; i >= 0; i--) {
        ball.trail[i].age--;
        if (ball.trail[i].age <= 0) {
            ball.trail.splice(i, 1);
        }
    }
    
    // Move the ball
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    
    // Wall collision (top and bottom)
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        // First, fix the ball position to prevent it from getting stuck in the wall
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius + 1;
        } else if (ball.y + ball.radius > canvas.height) {
            ball.y = canvas.height - ball.radius - 1;
        }
        
        // Reverse vertical direction with increased random adjustment
        ball.velocityY = -ball.velocityY;
        
        // Add a stronger random horizontal adjustment when hitting top/bottom walls
        ball.velocityX += (Math.random() - 0.5) * 3;
        
        // Ensure ball maintains significant horizontal movement
        if (Math.abs(ball.velocityX) < ball.speed * 0.7) {
            ball.velocityX = (ball.velocityX > 0 ? 1 : -1) * ball.speed * 0.7;
        }
    }
    
    // Player 1 paddle collision
    if (collision(ball, player1)) {
        // First, fix the ball position to prevent it from getting stuck in the paddle
        ball.x = player1.x + player1.width + ball.radius + 1;
        
        // Where the ball hit the paddle
        let collidePoint = ball.y - (player1.y + player1.height / 2);
        
        // Normalize the value (-1 to 1)
        collidePoint = collidePoint / (player1.height / 2);
        
        // Calculate angle in radians (limit to -40 to 40 degrees to prevent too vertical angles)
        let angleRad = collidePoint * (Math.PI / 4.5);
        
        // Always direct ball to the right after hitting player paddle
        let direction = 1;
        
        // Ensure a minimum horizontal velocity to prevent infinite loops
        const minHorizontalVelocity = ball.speed * 0.7;
        
        // Change velocity X and Y
        ball.velocityX = Math.max(minHorizontalVelocity, direction * ball.speed * Math.cos(angleRad));
        ball.velocityY = ball.speed * Math.sin(angleRad);
        
        // Add more randomness to the angle to prevent repetitive patterns
        ball.velocityY += (Math.random() - 0.5) * 3;
        
        // Ensure the ball has some vertical movement
        if (Math.abs(ball.velocityY) < 2) {
            ball.velocityY = (Math.random() > 0.5 ? 2 : -2);
        }
        
        // Player 1 scores in 1-player mode only
        if (gameMode === 1) {
            player1.score++;
            updateScore();
            
            // Increment hit count and shrink the ball by 1 pixel each hit, up to 20 pixels total
            if (ball.hitCount < ball.maxHits) {
                ball.hitCount++;
                ball.radius = ball.initialRadius - ball.hitCount;
            }
        }
    }
    
    // Right side collision handling
    if (gameMode === 1) {
        // 1-player mode: Wall collision
        // Use a smaller effective radius for the wall collision too
        if (ball.x + (ball.radius * 0.6) > wall.x) {
            // Fix the ball position to prevent it from getting stuck in the wall
            ball.x = wall.x - ball.radius - 1;
            
            // Ensure the ball bounces back with significant horizontal velocity
            ball.velocityX = -Math.abs(ball.velocityX) * 1.1;
            
            // Add sufficient randomness to the bounce to prevent predictable patterns
            ball.velocityY += (Math.random() - 0.5) * 4;
            
            // Make sure the ball has some vertical movement
            if (Math.abs(ball.velocityY) < 2) {
                ball.velocityY = (Math.random() > 0.5 ? 2 : -2);
            }
        }
    } else {
        // 2-player mode: Player 2 paddle collision
        if (collision(ball, player2)) {
            // Fix the ball position to prevent it from getting stuck in the paddle
            ball.x = player2.x - ball.radius - 1;
            
            // Where the ball hit the paddle
            let collidePoint = ball.y - (player2.y + player2.height / 2);
            
            // Normalize the value (-1 to 1)
            collidePoint = collidePoint / (player2.height / 2);
            
            // Calculate angle in radians (limit to -40 to 40 degrees to prevent too vertical angles)
            let angleRad = collidePoint * (Math.PI / 4.5);
            
            // Always direct ball to the left after hitting player 2 paddle
            let direction = -1;
            
            // Ensure a minimum horizontal velocity to prevent infinite loops
            const minHorizontalVelocity = ball.speed * 0.7;
            
            // Change velocity X and Y
            ball.velocityX = Math.min(-minHorizontalVelocity, direction * ball.speed * Math.cos(angleRad));
            ball.velocityY = ball.speed * Math.sin(angleRad);
            
            // Add randomness to the angle to prevent repetitive patterns
            ball.velocityY += (Math.random() - 0.5) * 3;
            
            // Ensure the ball has some vertical movement
            if (Math.abs(ball.velocityY) < 2) {
                ball.velocityY = (Math.random() > 0.5 ? 2 : -2);
            }
        }
        
        // Player 2 scores when player 1 misses
        if (ball.x - (ball.radius * 0.6) < 0) {
            player2.score++;
            updateScore();
            resetBall();
        }
        
        // Player 1 scores when player 2 misses
        if (ball.x + (ball.radius * 0.6) > canvas.width) {
            player1.score++;
            updateScore();
            resetBall();
            
            // Shrink the ball in 2-player mode as well
            if (ball.hitCount < ball.maxHits) {
                ball.hitCount++;
                ball.radius = ball.initialRadius - ball.hitCount;
            }
        }
    }
    
    // Player 1 misses the ball in 1-player mode
    if (gameMode === 1 && ball.x - (ball.radius * 0.6) < 0) {
        // Wall scores
        wall.score++;
        updateScore();
        resetBall();
    }
}

function render() {
    // Clear canvas
    drawRect(0, 0, canvas.width, canvas.height, '#000');
    
    // Draw net (center line)
    drawNet();
    
    // Draw trail of fading emojis
    if (currentEmoji) { // Only draw if we have an emoji
        for (let i = 0; i < ball.trail.length; i++) {
            const point = ball.trail[i];
            const alpha = point.age / 10; // Fade based on age
            
            // Main emoji font size
            const mainFontSize = ball.radius * 1.5;
            
            // Each trail emoji is just 2 pixels smaller than the one in front
            const fontSize = mainFontSize - (2 * (ball.trail.length - i));
            
            // Don't draw if too small
            if (fontSize < 15) continue;
            
            // Draw smaller fading emojis
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = "white"; // Ensure we have a fill color
            ctx.fillText(currentEmoji, point.x, point.y);
            ctx.restore(); // Restore previous context state
        }
    }
    
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
    
    // Draw ball (using emoji)
    drawEmoji(ball.x, ball.y, currentEmoji);
    
    // If game is over, display the message
    if (gameOver) {
        displayGameOver(gameOverMessage);
    }
}

function gameLoop() {
    update();
    render();
    
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Set initial emoji
initialEmoji = emojis[Math.floor(Math.random() * emojis.length)];
currentEmoji = initialEmoji;

// Make sure we have a valid emoji (debug step)
if (!currentEmoji) {
    currentEmoji = '😀'; // Fallback to a default emoji
}

// Debug logging
console.log("Initial emoji set to:", currentEmoji);

// Initial render
render();
    
}; // End of window.onload function