import React, { useState, useEffect, useRef, useCallback } from "react";
import "./BrickBreaker.css";

// Game constants (base size)
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;
const PADDLE_WIDTH = 160;
const PADDLE_HEIGHT = 15;
const PADDLE_SPEED = 7;
const BALL_SIZE = 12;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 25;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_PADDING = 5;
const BALL_SPEED_BASE = 1.7; // SLOWEST for mobile screens

const COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57", "#FF9FF3"
];

const getDeviceRatio = () => window.devicePixelRatio || 1;

const BrickBreaker = () => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const keysRef = useRef({});
  const [overlay, setOverlay] = useState(null); // null | "paused" | "gameOver" | "victory"

  // Responsive canvas size and scale
  const [canvasSize, setCanvasSize] = useState(() => {
    // fit max to mobile screen, but don't grow past base size
    const w = Math.min(BASE_WIDTH, window.innerWidth - 8);
    const h = w * BASE_HEIGHT / BASE_WIDTH;
    return { width: w, height: h, scale: w / BASE_WIDTH };
  });

  // Game state
  const [gameState, setGameState] = useState({
    score: 0,
    lives: 3,
    level: 1,
    gameStatus: "playing", // playing, paused, gameOver, victory
    paddle: {
      x: BASE_WIDTH / 2 - PADDLE_WIDTH / 2,
      y: BASE_HEIGHT - 40,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    },
    ball: {
      x: BASE_WIDTH / 2,
      y: BASE_HEIGHT / 2,
      dx: BALL_SPEED_BASE,
      dy: -BALL_SPEED_BASE,
      size: BALL_SIZE
    },
    bricks: []
  });

  // Responsive canvas
  const updateCanvasSize = useCallback(() => {
    let w = Math.min(BASE_WIDTH, window.innerWidth - 8);
    let h = w * BASE_HEIGHT / BASE_WIDTH;
    if (h > window.innerHeight - 140) {
      h = window.innerHeight - 140;
      w = h * BASE_WIDTH / BASE_HEIGHT;
    }
    setCanvasSize({
      width: w,
      height: h < 230 ? 230 : h,
      scale: w / BASE_WIDTH
    });
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [updateCanvasSize]);

  // Initialize bricks
  const initializeBricks = useCallback(() => {
    const bricks = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING + 30,
          y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_PADDING + 60,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          color: COLORS[row % COLORS.length],
          visible: true,
          points: (BRICK_ROWS - row) * 10
        });
      }
    }
    return bricks;
  }, []);

  // Initialize game state bricks on load
  useEffect(() => {
    setGameState((prev) => ({
      ...prev,
      bricks: initializeBricks()
    }));
  }, [initializeBricks]);

  // Keyboard controls (NO R to restart anymore!)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "ArrowLeft" || e.key === "ArrowRight" ||
        e.key === "a" || e.key === "d"
      ) {
        keysRef.current[e.key] = true;
      }
      if (e.key === " ") {
        e.preventDefault();
        if (!overlay) setOverlay("paused");
        else if (overlay === "paused") setOverlay(null);
      }
    };
    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [overlay]);

  // Touch and mouse paddle movement
  const movePaddleTo = useCallback(
    (clientX) => {
      const rect = canvasRef.current.getBoundingClientRect();
      let x = ((clientX - rect.left) / canvasSize.scale) - gameState.paddle.width / 2;
      x = Math.max(0, Math.min(BASE_WIDTH - gameState.paddle.width, x));
      setGameState((prev) => ({
        ...prev,
        paddle: { ...prev.paddle, x }
      }));
    },
    [canvasSize.scale, gameState.paddle.width]
  );

  useEffect(() => {
    const handleTouchMove = (e) => {
      e.preventDefault();
      movePaddleTo(e.touches[0].clientX);
    };
    const handleMouseMove = (e) => {
      if (e.buttons === 1 || e.type === "mousedown" || e.type === "mousemove") {
        movePaddleTo(e.clientX);
      }
    };
    const canvas = canvasRef.current;
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchstart", handleTouchMove, { passive: false });
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseMove);
    return () => {
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchstart", handleTouchMove);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseMove);
    };
  }, [movePaddleTo]);

  // Reset game state
  const resetGame = useCallback(() => {
    setGameState({
      score: 0,
      lives: 3,
      level: 1,
      gameStatus: "playing",
      paddle: {
        x: BASE_WIDTH / 2 - PADDLE_WIDTH / 2,
        y: BASE_HEIGHT - 40,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT
      },
      ball: {
        x: BASE_WIDTH / 2,
        y: BASE_HEIGHT / 2,
        dx: BALL_SPEED_BASE * (Math.random() > 0.5 ? 1 : -1),
        dy: -BALL_SPEED_BASE,
        size: BALL_SIZE
      },
      bricks: initializeBricks()
    });
    setOverlay(null);
  }, [initializeBricks]);

  // Ball after a life lost
  const resetBall = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      ball: {
        x: BASE_WIDTH / 2,
        y: BASE_HEIGHT / 2,
        dx: BALL_SPEED_BASE * (Math.random() > 0.5 ? 1 : -1),
        dy: -BALL_SPEED_BASE,
        size: BALL_SIZE
      }
    }));
  }, []);

  // Collision detection
  const checkCollision = (rect1, rect2) => (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );

  // Main game updater
  const updateGame = useCallback(() => {
    setGameState((prev) => {
      let newState = { ...prev };
      let { paddle, ball, bricks, gameStatus, lives } = newState;
      if (overlay || gameStatus !== "playing") return prev;

      // Keyboard left/right
      if (keysRef.current["ArrowLeft"] || keysRef.current["a"]) {
        paddle.x = Math.max(0, paddle.x - PADDLE_SPEED);
      }
      if (keysRef.current["ArrowRight"] || keysRef.current["d"]) {
        paddle.x = Math.min(BASE_WIDTH - paddle.width, paddle.x + PADDLE_SPEED);
      }
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Ball collision with walls
      if (ball.x <= ball.size / 2 || ball.x >= BASE_WIDTH - ball.size / 2) {
        ball.dx = -ball.dx;
        ball.x = ball.x <= ball.size / 2 ? ball.size / 2 : BASE_WIDTH - ball.size / 2;
      }
      if (ball.y <= ball.size / 2) {
        ball.dy = -ball.dy;
        ball.y = ball.size / 2;
      }

      // Paddle collision
      const ballRect = {
        x: ball.x - ball.size / 2,
        y: ball.y - ball.size / 2,
        width: ball.size,
        height: ball.size
      };
      if (checkCollision(ballRect, paddle) && ball.dy > 0) {
        ball.dy = -ball.dy;
        const paddleCenter = paddle.x + paddle.width / 2;
        const hitPos = (ball.x - paddleCenter) / (paddle.width / 2);
        ball.dx = Math.max(-BALL_SPEED_BASE * 1.3, Math.min(BALL_SPEED_BASE * 1.3, ball.dx + hitPos * 2 / 1.3));
      }

      // Bricks collision
      let scoreIncrease = 0;
      bricks.forEach((brick) => {
        if (brick.visible && checkCollision(ballRect, brick)) {
          brick.visible = false;
          scoreIncrease += brick.points;
          if (
            ballRect.y + ballRect.height - ball.dy <= brick.y ||
            ballRect.y - ball.dy >= brick.y + brick.height
          ) {
            ball.dy = -ball.dy;
          } else {
            ball.dx = -ball.dx;
          }
        }
      });
      newState.score += scoreIncrease;

      // Level cleared
      const visibleBricks = bricks.filter((b) => b.visible);
      if (visibleBricks.length === 0) {
        setOverlay("victory");
        newState.gameStatus = "victory";
      }

      // Ball out
      if (ball.y >= BASE_HEIGHT) {
        newState.lives -= 1;
        if (newState.lives <= 0) {
          setOverlay("gameOver");
          newState.gameStatus = "gameOver";
        } else {
          setTimeout(() => resetBall(), 800);
        }
      }
      return newState;
    });
  }, [overlay, resetBall]);

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      updateGame();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [updateGame]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const ratio = getDeviceRatio();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(canvasSize.scale * ratio, canvasSize.scale * ratio);

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, BASE_HEIGHT);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#16213e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // Bricks
    gameState.bricks.forEach((brick) => {
      if (brick.visible) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      }
    });

    // Paddle
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      gameState.paddle.x,
      gameState.paddle.y,
      gameState.paddle.width,
      gameState.paddle.height
    );
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      gameState.paddle.x,
      gameState.paddle.y,
      gameState.paddle.width,
      gameState.paddle.height
    );

    // Ball
    ctx.fillStyle = "#ffff00";
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // UI
    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);
    ctx.fillText(`Lives: ${gameState.lives}`, 20, 55);
    ctx.fillText(`Level: ${gameState.level}`, BASE_WIDTH - 100, 30);

    ctx.restore();
  }, [gameState, canvasSize]);

  // Retina canvas & style size
  useEffect(() => {
    const canvas = canvasRef.current;
    const ratio = getDeviceRatio();
    canvas.width = BASE_WIDTH * canvasSize.scale * ratio;
    canvas.height = BASE_HEIGHT * canvasSize.scale * ratio;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
  }, [canvasSize]);

  // Overlay component
  function OverlayComp() {
    if (!overlay) return null;
    let title = "";
    let message = "";
    let color = "";
    if (overlay === "paused") {
      title = "PAUSED";
      message = "Tap/click to resume";
      color = "rgba(0,0,0,0.82)";
    }
    if (overlay === "gameOver") {
      title = "GAME OVER";
      message = "Tap/click to play again!";
      color = "rgba(255,0,0,0.75)";
    }
    if (overlay === "victory") {
      title = "VICTORY!";
      message = "Tap/click to play again!";
      color = "rgba(48,222,68,0.82)";
    }

    return (
      <div
        className="bb-overlay"
        style={{
          background: color,
          width: canvasSize.width,
          height: canvasSize.height,
          fontSize: canvasSize.width < 550 ? "1.7rem" : "2.3rem"
        }}
        onClick={() => {
          if (overlay === "paused") setOverlay(null);
          else resetGame();
        }}
        tabIndex={0}
      >
        <div className="bb-overlay-inner">
          <span className="bb-title">{title}</span>
          <span className="bb-msg">{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="brick-breaker-container">
      <div className="game-header">
        <h1>Brick Breaker</h1>
        <div className="controls">
          <p>← → / A D or Drag/Touch to move paddle</p>
          <p>SPACE to pause</p>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className="game-canvas"
          style={{ touchAction: 'none', background: '#1a1a2e' }}
        />
        <OverlayComp />
      </div>
      <div className="game-info">
        <div className="stats">
          <span>Score: {gameState.score}</span>
          <span>Lives: {gameState.lives}</span>
          <span>Level: {gameState.level}</span>
        </div>
        <button onClick={resetGame} className="reset-btn">
          New Game
        </button>
      </div>
    </div>
  );
};

export default BrickBreaker;
