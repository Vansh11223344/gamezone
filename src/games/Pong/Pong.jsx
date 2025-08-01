import React, { useRef, useEffect, useState, useCallback } from "react";
import "./Pong.css";

// Game constants
const BASE_W = 800;
const BASE_H = 400;
const PADDLE_W = 12;
const PADDLE_H = 80;
const BALL_SIZE = 12;
const BALL_SPEED = 8;
const PADDLE_SPEED = 6;
const AI_SPEED = 3;

function Pong() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const keysRef = useRef({});
  const lastTimeRef = useRef(0);

  // Game state
  const [gameState, setGameState] = useState({
    playerY: BASE_H / 2 - PADDLE_H / 2,
    aiY: BASE_H / 2 - PADDLE_H / 2,
    ballX: BASE_W / 2,
    ballY: BASE_H / 2,
    ballVelX: BALL_SPEED,
    ballVelY: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    playerScore: 0,
    aiScore: 0,
    gameRunning: false,
    gameStarted: false,
  });

  // Detect if device is mobile
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive canvas sizing and mobile detection
  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const scaleX = containerWidth / BASE_W;
      const scaleY = containerHeight / BASE_H;
      const scale = Math.min(scaleX, scaleY, 1);

      const width = BASE_W * scale;
      const height = BASE_H * scale;

      setDimensions({ width, height, scale });
      setIsMobile(window.innerWidth <= 768); // Consider ≤768px as mobile
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [dimensions, setDimensions] = useState({
    width: BASE_W,
    height: BASE_H,
    scale: 1,
  });

  // Reset ball to center with random direction
  const resetBall = useCallback(() => {
    const angle = (Math.random() - 0.5) * Math.PI / 3; // Random angle
    const direction = Math.random() > 0.5 ? 1 : -1;

    setGameState((prev) => ({
      ...prev,
      ballX: BASE_W / 2,
      ballY: BASE_H / 2,
      ballVelX: BALL_SPEED * direction,
      ballVelY: BALL_SPEED * Math.sin(angle),
    }));
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      gameRunning: true,
      gameStarted: true,
      playerScore: 0,
      aiScore: 0,
    }));
    resetBall();
  }, [resetBall]);

  // Game loop
  useEffect(() => {
    if (!gameState.gameRunning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const gameLoop = (currentTime) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Limit delta time to prevent large jumps
      const dt = Math.min(deltaTime / 16.67, 2);

      setGameState((prev) => {
        let newState = { ...prev };

        // Handle player input
        if (keysRef.current.ArrowUp || keysRef.current.KeyW) {
          newState.playerY = Math.max(0, newState.playerY - PADDLE_SPEED * dt);
        }
        if (keysRef.current.ArrowDown || keysRef.current.KeyS) {
          newState.playerY = Math.min(
            BASE_H - PADDLE_H,
            newState.playerY + PADDLE_SPEED * dt
          );
        }

        // AI paddle movement
        const aiCenter = newState.aiY + PADDLE_H / 2;
        const ballCenter = newState.ballY;
        const diff = ballCenter - aiCenter;

        if (Math.abs(diff) > 2) {
          const moveSpeed = AI_SPEED * dt;
          if (diff > 0) {
            newState.aiY = Math.min(BASE_H - PADDLE_H, newState.aiY + moveSpeed);
          } else {
            newState.aiY = Math.max(0, newState.aiY - moveSpeed);
          }
        }

        // Ball movement
        newState.ballX += newState.ballVelX * dt;
        newState.ballY += newState.ballVelY * dt;

        // Ball collision with top and bottom walls
        if (newState.ballY <= 0 || newState.ballY >= BASE_H - BALL_SIZE) {
          newState.ballVelY = -newState.ballVelY;
          newState.ballY = Math.max(0, Math.min(BASE_H - BALL_SIZE, newState.ballY));
        }

        // Ball collision with player paddle (right side)
        if (
          newState.ballX + BALL_SIZE >= BASE_W - PADDLE_W - 5 &&
          newState.ballX <= BASE_W - PADDLE_W &&
          newState.ballY + BALL_SIZE >= newState.playerY &&
          newState.ballY <= newState.playerY + PADDLE_H
        ) {
          newState.ballVelX = -Math.abs(newState.ballVelX);
          newState.ballX = BASE_W - PADDLE_W - BALL_SIZE - 5;

          // Add spin based on where ball hits paddle
          const hitPos =
            (newState.ballY + BALL_SIZE / 2 - newState.playerY - PADDLE_H / 2) /
            (PADDLE_H / 2);
          newState.ballVelY = BALL_SPEED * hitPos * 0.75;
        }

        // Ball collision with AI paddle (left side)
        if (
          newState.ballX <= PADDLE_W + 5 &&
          newState.ballX + BALL_SIZE >= 0 &&
          newState.ballY + BALL_SIZE >= newState.aiY &&
          newState.ballY <= newState.aiY + PADDLE_H
        ) {
          newState.ballVelX = Math.abs(newState.ballVelX);
          newState.ballX = PADDLE_W + 5;

          // Add spin based on where ball hits paddle
          const hitPos =
            (newState.ballY + BALL_SIZE / 2 - newState.aiY - PADDLE_H / 2) /
            (PADDLE_H / 2);
          newState.ballVelY = BALL_SPEED * hitPos * 0.75;
        }

        // Score detection
        if (newState.ballX < -BALL_SIZE) {
          newState.playerScore++;
          newState.ballX = BASE_W / 2;
          newState.ballY = BASE_H / 2;
          newState.ballVelX = BALL_SPEED;
          newState.ballVelY = (Math.random() - 0.5) * BALL_SPEED;
        } else if (newState.ballX > BASE_W + BALL_SIZE) {
          newState.aiScore++;
          newState.ballX = BASE_W / 2;
          newState.ballY = BASE_H / 2;
          newState.ballVelX = -BALL_SPEED;
          newState.ballVelY = (Math.random() - 0.5) * BALL_SPEED;
        }

        // Check for game end
        if (newState.playerScore >= 10 || newState.aiScore >= 10) {
          newState.gameRunning = false;
        }

        return newState;
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.gameRunning]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, BASE_W, BASE_H);

    // Draw background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    // Draw center line
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(BASE_W / 2, 0);
    ctx.lineTo(BASE_W / 2, BASE_H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = "#fff";
    ctx.fillRect(5, gameState.aiY, PADDLE_W, PADDLE_H);
    ctx.fillRect(BASE_W - PADDLE_W - 5, gameState.playerY, PADDLE_W, PADDLE_H);

    // Draw ball
    ctx.beginPath();
    ctx.arc(
      gameState.ballX + BALL_SIZE / 2,
      gameState.ballY + BALL_SIZE / 2,
      BALL_SIZE / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw scores
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    ctx.fillText(gameState.aiScore.toString(), BASE_W / 4, 50);
    ctx.fillText(gameState.playerScore.toString(), (BASE_W * 3) / 4, 50);

    // Draw game over message
    if (!gameState.gameRunning && gameState.gameStarted) {
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff0";
      const winner =
        gameState.playerScore >= 10 ? "YOU WIN!" : "YOU LOSE!";
      ctx.fillText(winner, BASE_W / 2, BASE_H / 2);
      if (!isMobile) {
        ctx.font = "24px Arial";
        ctx.fillText("Press SPACE to restart", BASE_W / 2, BASE_H / 2 + 50);
      }
    }
  }, [gameState, isMobile]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true;

      if (e.code === "Space" && !gameState.gameRunning) {
        e.preventDefault();
        startGame();
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState.gameRunning, startGame]);

  // Touch controls
  const handleTouchStart = (direction) => {
    if (direction === "up") {
      keysRef.current.ArrowUp = true;
    } else {
      keysRef.current.ArrowDown = true;
    }
  };

  const handleTouchEnd = (direction) => {
    if (direction === "up") {
      keysRef.current.ArrowUp = false;
    } else {
      keysRef.current.ArrowDown = false;
    }
  };

  return (
    <div className="pong-container">
      <h1 className="pong-title">PONG</h1>
      <div className="pong-game-area">
        <canvas
          ref={canvasRef}
          width={BASE_W}
          height={BASE_H}
          className="pong-canvas"
        />
        <div className="pong-touch-controls">
          <button
            onTouchStart={() => handleTouchStart("up")}
            onTouchEnd={() => handleTouchEnd("up")}
            onMouseDown={() => (keysRef.current.ArrowUp = true)}
            onMouseUp={() => (keysRef.current.ArrowUp = false)}
            onMouseLeave={() => (keysRef.current.ArrowUp = false)}
            className="pong-control-btn"
          >
            ▲
          </button>
          <button
            onTouchStart={() => handleTouchStart("down")}
            onTouchEnd={() => handleTouchEnd("down")}
            onMouseDown={() => (keysRef.current.ArrowDown = true)}
            onMouseUp={() => (keysRef.current.ArrowDown = false)}
            onMouseLeave={() => (keysRef.current.ArrowDown = false)}
            className="pong-control-btn"
          >
            ▼
          </button>
        </div>
      </div>
      <div className="pong-instructions">
        {!gameState.gameStarted ? (
          <div>
            <p>Press SPACE or tap START to begin!</p>
            <p>Use Arrow Keys, W/S, or touch buttons to move your paddle</p>
            <p>First to 10 points wins!</p>
          </div>
        ) : (
          <div>
            <p>Use Arrow Keys, W/S, or touch buttons to move</p>
            <p>AI: {gameState.aiScore} - {gameState.playerScore} :You</p>
          </div>
        )}
      </div>
      {!gameState.gameRunning && (
        <button onClick={startGame} className="pong-start-btn">
          {gameState.gameStarted ? "RESTART GAME" : "START GAME"}
        </button>
      )}
    </div>
  );
}

export default Pong;