import React, { useRef, useEffect, useState } from "react";
import "./Tetris.css";

const BOARD_W = 10;
const BOARD_H = 20;
const BLOCK_SIZE = 24;
const GAME_W = BOARD_W * BLOCK_SIZE;
const GAME_H = BOARD_H * BLOCK_SIZE;

const SHAPES = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
  ],
  O: [[[1,1],[1,1]]],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]],
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]],
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]],
  ],
};

const SHAPE_KEYS = Object.keys(SHAPES);
const COLORS = {
  I: "#98f3fe",
  O: "#e1ef42",
  T: "#f76ea0",
  S: "#9dfefd",
  Z: "#ff666a",
  J: "#d2ff9b",
  L: "#e8e568",
};

function createBoard() {
  return Array(BOARD_H)
    .fill()
    .map(() => Array(BOARD_W).fill(null));
}

function randomInt(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

export default function Tetris() {
  const [state, setState] = useState(initState());
  const [pressed, setPressed] = useState({});
  const [gameOver, setGameOver] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [highScore, setHighScore] = useState(
    localStorage.getItem("tetrisHighScore") || 0
  );
  const heldInterval = useRef({});
  const lastFrameTime = useRef(performance.now());
  const animationFrame = useRef();
  const lastAction = useRef({ key: null, time: 0 });

  function initState() {
    return {
      board: createBoard(),
      piece: null,
      nextPiece: randomPiece(),
      score: 0,
      lines: 0,
      level: 1,
      frame: 0,
      particles: [],
    };
  }

  function randomPiece() {
    const type = SHAPE_KEYS[randomInt(0, SHAPE_KEYS.length - 1)];
    return { type, rotation: 0, x: Math.floor(BOARD_W / 2) - 2, y: 0 };
  }

  // Keyboard Controls with Debounce
  useEffect(() => {
    const down = (e) => {
      const now = Date.now();
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)
      ) {
        if (now - lastAction.current.time > 100) {
          setPressed((prv) => ({ ...prv, [e.key]: true }));
          lastAction.current = { key: e.key, time: now };
        }
      }
      if (e.key === "Enter" && !gameStarted) setGameStarted(true);
      if (e.key === "Enter" && gameOver) handleReset();
      if (e.key === "p") setPaused((p) => !p);
    };
    const up = (e) => {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)
      ) {
        setPressed((prv) => ({ ...prv, [e.key]: false }));
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [gameStarted, gameOver]);

  // On-screen control hold
  function beginHold(key) {
    const now = Date.now();
    if (now - lastAction.current.time > 100) {
      setPressed((pressed) => ({ ...pressed, [key]: true }));
      lastAction.current = { key, time: now };
    }
    if (heldInterval.current[key]) clearInterval(heldInterval.current[key]);
    heldInterval.current[key] = setInterval(() => {
      const now = Date.now();
      if (now - lastAction.current.time > 100) {
        setPressed((prv) => ({ ...prv, [key]: true }));
        lastAction.current = { key, time: now };
      }
    }, 100);
  }
  function endHold(key) {
    setPressed((pressed) => ({ ...pressed, [key]: false }));
    if (heldInterval.current[key]) {
      clearInterval(heldInterval.current[key]);
      heldInterval.current[key] = null;
    }
  }
  useEffect(
    () => () => {
      Object.values(heldInterval.current).forEach((x) => x && clearInterval(x));
    },
    []
  );

  // Collision Detection
  function canPlace(piece, board) {
    const shape = SHAPES[piece.type][piece.rotation];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = piece.x + x;
          const boardY = piece.y + y;
          if (
            boardX < 0 ||
            boardX >= BOARD_W ||
            boardY >= BOARD_H ||
            (boardY >= 0 && board[boardY][boardX])
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // Rotation with Wall Kicks
  function rotatePiece(piece) {
    const newRotation = (piece.rotation + 1) % SHAPES[piece.type].length;
    const newPiece = { ...piece, rotation: newRotation };
    // Try basic wall kicks
    const offsets = [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: -1, y: -1 },
      { x: 1, y: -1 },
    ];
    for (let offset of offsets) {
      const testPiece = {
        ...newPiece,
        x: piece.x + offset.x,
        y: piece.y + offset.y,
      };
      if (canPlace(testPiece, state.board)) {
        return testPiece;
      }
    }
    return piece;
  }

  // Place piece on board
  function placePiece(s) {
    const shape = SHAPES[s.piece.type][s.piece.rotation];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardY = s.piece.y + y;
          if (boardY >= 0) {
            s.board[boardY][s.piece.x + x] = s.piece.type;
          }
        }
      }
    }

    // Clear lines
    let linesCleared = 0;
    s.board = s.board.filter((row, y) => {
      if (row.every((cell) => cell)) {
        linesCleared++;
        addLineClearParticles(s, y);
        return false;
      }
      return true;
    });
    while (s.board.length < BOARD_H) {
      s.board.unshift(Array(BOARD_W).fill(null));
    }

    // Update score and level
    if (linesCleared > 0) {
      s.score += [0, 100, 300, 500, 800][linesCleared] * s.level;
      s.lines += linesCleared;
      s.level = Math.floor(s.lines / 10) + 1;
      playSound("lineclear");
    }

    s.piece = null;
  }

  // Particle effects
  function addLineClearParticles(state, row) {
    for (let x = 0; x < BOARD_W; x++) {
      for (let i = 0; i < 3; i++) {
        state.particles.push({
          x: x * BLOCK_SIZE + BLOCK_SIZE / 2,
          y: row * BLOCK_SIZE + BLOCK_SIZE / 2,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 0.5,
          color: COLORS[state.board[row][x]] || "#ffffff",
        });
      }
    }
  }

  // Main Game Loop
  useEffect(() => {
    if (!gameStarted || gameOver || paused) return;

    const update = (now) => {
      const deltaTime = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;

      setState((st) => {
        let s = structuredClone(st);

        // Initialize piece if none
        if (!s.piece) {
          s.piece = s.nextPiece;
          s.nextPiece = randomPiece();
          if (!canPlace(s.piece, s.board)) {
            setGameOver("lose");
            playSound("gameover");
            return s;
          }
        }

        // Handle input
        if (pressed["ArrowLeft"]) {
          const newPiece = { ...s.piece, x: s.piece.x - 1 };
          if (canPlace(newPiece, s.board)) s.piece = newPiece;
        }
        if (pressed["ArrowRight"]) {
          const newPiece = { ...s.piece, x: s.piece.x + 1 };
          if (canPlace(newPiece, s.board)) s.piece = newPiece;
        }
        if (pressed["ArrowUp"]) {
          s.piece = rotatePiece(s.piece);
          playSound("rotate");
        }
        if (pressed[" "]) {
          let newPiece = { ...s.piece };
          while (canPlace({ ...newPiece, y: newPiece.y + 1 }, s.board)) {
            newPiece.y += 1;
          }
          s.piece = newPiece;
          placePiece(s);
          playSound("drop");
          setPressed((prv) => ({ ...prv, " ": false }));
        }
        if (pressed["ArrowDown"]) {
          const newPiece = { ...s.piece, y: s.piece.y + 1 };
          if (canPlace(newPiece, s.board)) {
            s.piece = newPiece;
          } else {
            placePiece(s);
            playSound("land");
          }
        }

        // Auto-drop
        s.frame += deltaTime * 60;
        const fallSpeed = pressed["ArrowDown"]
          ? 0.5
          : Math.max(0.1, 1 - s.level * 0.05);
        if (s.frame >= fallSpeed * 60) {
          const newPiece = { ...s.piece, y: s.piece.y + 1 };
          if (canPlace(newPiece, s.board)) {
            s.piece = newPiece;
          } else {
            placePiece(s);
            playSound("land");
          }
          s.frame = 0;
        }

        // Update particles
        s.particles = s.particles
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 60 * deltaTime,
            y: p.y + p.vy * 60 * deltaTime,
            life: p.life - deltaTime,
          }))
          .filter((p) => p.life > 0);

        return s;
      });

      animationFrame.current = requestAnimationFrame(update);
    };

    animationFrame.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame.current);
  }, [pressed, gameStarted, gameOver, paused]);

  // High Score
  useEffect(() => {
    if (state.score > highScore) {
      setHighScore(state.score);
      localStorage.setItem("tetrisHighScore", state.score);
    }
  }, [state.score]);

  // Sound Placeholder
  function playSound(type) {
    // Implement with Howler.js or HTML5 Audio
  }

  function handleReset() {
    setState(initState());
    setGameOver(null);
    setGameStarted(true);
    setPaused(false);
  }

  function handleStart() {
    setGameStarted(true);
    setPaused(false);
  }

  function handleBtnDown(key) {
    beginHold(key);
  }
  function handleBtnUp(key) {
    endHold(key);
  }

  return (
    <div className="tetris-main">
      <div className="si-title">Tetris</div>
      <div className="si-scorebar">
        <span>
          Score: <b>{state.score}</b>
        </span>
        <span>
          High: <b>{highScore}</b>
        </span>
        <span>
          Level: <b>{state.level}</b>
        </span>
        <span>
          Lines: <b>{state.lines}</b>
        </span>
      </div>
      <div className="tetris-game-stack">
        <div className="si-board-wrap">
          <svg className="si-svg" viewBox={`0 0 ${GAME_W} ${GAME_H}`}>
            <rect x={0} y={0} width={GAME_W} height={GAME_H} fill="#040606" />
            {/* Board */}
            {state.board.map((row, y) =>
              row.map((cell, x) =>
                cell ? (
                  <rect
                    key={`${x},${y}`}
                    x={x * BLOCK_SIZE}
                    y={y * BLOCK_SIZE}
                    width={BLOCK_SIZE}
                    height={BLOCK_SIZE}
                    fill={COLORS[cell]}
                    stroke="#ffffff"
                    strokeWidth="1"
                    opacity="0.87"
                  />
                ) : null
              )
            )}
            {/* Current Piece */}
            {state.piece &&
              SHAPES[state.piece.type][state.piece.rotation].map((row, dy) =>
                row.map((cell, dx) =>
                  cell ? (
                    <rect
                      key={`piece-${dx},${dy}`}
                      x={(state.piece.x + dx) * BLOCK_SIZE}
                      y={(state.piece.y + dy) * BLOCK_SIZE}
                      width={BLOCK_SIZE}
                      height={BLOCK_SIZE}
                      fill={COLORS[state.piece.type]}
                      stroke="#ffffff"
                      strokeWidth="1"
                      opacity="0.87"
                    />
                  ) : null
                )
              )}
            {/* Particles */}
            {state.particles.map((p, i) => (
              <circle
                key={`particle-${i}`}
                cx={p.x}
                cy={p.y}
                r={2}
                fill={p.color}
                opacity={p.life / 0.5}
              />
            ))}
          </svg>
          {/* Overlays */}
          {!gameStarted && (
            <div className="si-start">
              <div className="si-end-card">
                <b>Tetris</b>
                <p>Press Enter or tap to start</p>
                <button className="si-btn" onClick={handleStart}>
                  Start Game
                </button>
              </div>
            </div>
          )}
          {gameOver && (
            <div className="si-end">
              <div className="si-end-card">
                <b>💀 Game Over</b>
                <div className="si-score-msg">
                  Score: <span>{state.score}</span>
                </div>
                <div className="si-score-msg">
                  High Score: <span>{highScore}</span>
                </div>
                <button className="si-btn" onClick={handleReset}>
                  Play Again
                </button>
              </div>
            </div>
          )}
          {paused && gameStarted && !gameOver && (
            <div className="si-end">
              <div className="si-end-card">
                <b>Paused</b>
                <p>Press P to resume</p>
                <button className="si-btn" onClick={() => setPaused(false)}>
                  Resume
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="si-controls">
          <button
            aria-label="Left"
            onTouchStart={() => handleBtnDown("ArrowLeft")}
            onTouchEnd={() => handleBtnUp("ArrowLeft")}
            onMouseDown={() => handleBtnDown("ArrowLeft")}
            onMouseUp={() => handleBtnUp("ArrowLeft")}
            onMouseLeave={() => handleBtnUp("ArrowLeft")}
            tabIndex={0}
          >
            ←
          </button>
          <button
            aria-label="Rotate"
            onTouchStart={() => handleBtnDown("ArrowUp")}
            onTouchEnd={() => handleBtnUp("ArrowUp")}
            onMouseDown={() => handleBtnDown("ArrowUp")}
            onMouseUp={() => handleBtnUp("ArrowUp")}
            onMouseLeave={() => handleBtnUp("ArrowUp")}
            tabIndex={0}
          >
            ↻
          </button>
          <button
            aria-label="Right"
            onTouchStart={() => handleBtnDown("ArrowRight")}
            onTouchEnd={() => handleBtnUp("ArrowRight")}
            onMouseDown={() => handleBtnDown("ArrowRight")}
            onMouseUp={() => handleBtnUp("ArrowRight")}
            onMouseLeave={() => handleBtnUp("ArrowRight")}
            tabIndex={0}
          >
            →
          </button>
          <button
            aria-label="Soft Drop"
            className="si-shoot"
            onTouchStart={() => handleBtnDown("ArrowDown")}
            onTouchEnd={() => handleBtnUp("ArrowDown")}
            onMouseDown={() => handleBtnDown("ArrowDown")}
            onMouseUp={() => handleBtnUp("ArrowDown")}
            onMouseLeave={() => handleBtnUp("ArrowDown")}
            tabIndex={0}
          >
            ↓
          </button>
          <button
            aria-label="Hard Drop"
            className="si-shoot"
            onTouchStart={() => handleBtnDown(" ")}
            onTouchEnd={() => handleBtnUp(" ")}
            onMouseDown={() => handleBtnDown(" ")}
            onMouseUp={() => handleBtnUp(" ")}
            onMouseLeave={() => handleBtnUp(" ")}
            tabIndex={0}
          >
            ⇓
          </button>
        </div>
      </div>
      <div className="si-help">
        <b>How to play:</b> Use ← → to move, ↑ to rotate, ↓ for soft drop, Space or ⇓ for hard drop, P to pause. Tap and hold buttons on mobile.
      </div>
    </div>
  );
}
