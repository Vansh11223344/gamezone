import React, { useState, useRef, useEffect } from "react";

// --- CONSTANTS ---
const BOARD_COLS = 20;
const BOARD_ROWS = 20;
const SQUARE_SIZE = 22;
const BORDER_WIDTH = 6;

const SEGMENT_SIZE = 18;
const SEGMENT_MARGIN = Math.floor((SQUARE_SIZE - SEGMENT_SIZE) / 2);
const FOOD_SIZE = 16;
const FOOD_MARGIN = Math.floor((SQUARE_SIZE - FOOD_SIZE) / 2);

const INITIAL_SNAKE = [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
];

const getRandomCell = (snake) => {
  let cell;
  while (true) {
    cell = {
      x: Math.floor(Math.random() * BOARD_COLS),
      y: Math.floor(Math.random() * BOARD_ROWS),
    };
    if (!snake.some(seg => seg.x === cell.x && seg.y === cell.y)) break;
  }
  return cell;
};

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const OPPOSITE = {
  ArrowUp: "ArrowDown",
  ArrowDown: "ArrowUp",
  ArrowLeft: "ArrowRight",
  ArrowRight: "ArrowLeft",
};

const SPEEDS = [
  { label: "Slow", value: 160 },
  { label: "Normal", value: 92 },
  { label: "Fast", value: 70 },
];

// --- MAIN COMPONENT ---
const Snake = () => {
  const [snake, setSnake] = useState([...INITIAL_SNAKE]);
  const [dir, setDir] = useState("ArrowRight");
  const [nextDir, setNextDir] = useState("ArrowRight");
  const [food, setFood] = useState(getRandomCell(INITIAL_SNAKE));
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [containerWidth, setContainerWidth] = useState(BOARD_COLS * SQUARE_SIZE);
  const [gamePaused, setGamePaused] = useState(false);

  // Responsive grid size
  useEffect(() => {
    const handleResize = () => {
      let min = Math.min(window.innerWidth - 32, 430);
      let grid = BOARD_COLS * SQUARE_SIZE;
      setContainerWidth(Math.min(min, grid));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate scale to fit within the outer container minus border
  const scale = (containerWidth - 2 * BORDER_WIDTH) / (BOARD_COLS * SQUARE_SIZE);

  // Step move logic, direction buffered
  const moveRef = useRef();
  moveRef.current = () => {
    setSnake(prevSnake => {
      const currDir = nextDir;
      setDir(currDir);
      const direction = DIRECTIONS[currDir];
      const nextHead = {
        x: (prevSnake[0].x + direction.x + BOARD_COLS) % BOARD_COLS,
        y: (prevSnake[0].y + direction.y + BOARD_ROWS) % BOARD_ROWS,
      };
      if (prevSnake.some(seg => seg.x === nextHead.x && seg.y === nextHead.y)) {
        setPlaying(false);
        setGameOver(true);
        setGamePaused(false);
        return prevSnake;
      }
      let hasEaten = (nextHead.x === food.x && nextHead.y === food.y);
      let newSnake = [nextHead, ...prevSnake];
      if (!hasEaten) {
        newSnake.pop();
      } else {
        setFood(getRandomCell(newSnake));
        setScore((s) => s + 1);
      }
      return newSnake;
    });
  };

  // Game loop
  useEffect(() => {
    if (!playing || gamePaused) return;
    const interval = setInterval(() => {
      moveRef.current?.();
    }, SPEEDS[speedIdx].value);
    return () => clearInterval(interval);
  }, [playing, speedIdx, gamePaused]);

  // Keyboard + prevent reversing
  useEffect(() => {
    if (!playing || gamePaused) return;
    const handle = (e) => {
      if (DIRECTIONS[e.key] && OPPOSITE[e.key] !== dir) {
        setNextDir(e.key);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [playing, dir, gamePaused]);

  // Touch/click D-pad
  const handleButtonDir = (key) => {
    if (DIRECTIONS[key] && OPPOSITE[key] !== dir) {
      setNextDir(key);
    }
  };

  // Panel controls
  const startGame = () => {
    setSnake([...INITIAL_SNAKE]);
    setDir("ArrowRight");
    setNextDir("ArrowRight");
    setFood(getRandomCell(INITIAL_SNAKE));
    setScore(0);
    setPlaying(true);
    setGameOver(false);
    setGamePaused(false);
  };

  const stopGame = () => {
    setGamePaused(true);
    setPlaying(false);
  };

  const resumeGame = () => {
    setPlaying(true);
    setGamePaused(false);
  };

  const canChangeSpeed = (!playing && !gamePaused) || gameOver;

  return (
    <div className="snake-game-container">
      <div className="snake-game-background">
        <div className="snake-game-pattern"></div>
        <div className="snake-nokia-container">
          <div className="snake-score-row">
            <span className="snake-score-label">Score:</span>
            <span className="snake-score-val">{score}</span>
            <span className="snake-speed">
              Speed:&nbsp;
              <select
                value={speedIdx}
                onChange={e => canChangeSpeed && setSpeedIdx(+e.target.value)}
                className="snake-speed-sel"
                disabled={!canChangeSpeed}
                aria-label="Select speed"
              >
                {SPEEDS.map((s, i) => (
                  <option key={s.value} value={i}>{s.label}</option>
                ))}
              </select>
            </span>
          </div>
          <div
            className="snake-board-outer"
            style={{
              width: containerWidth,
              height: containerWidth,
            }}
          >
            <div
              className="snake-board-inner"
              style={{
                width: BOARD_COLS * SQUARE_SIZE,
                height: BOARD_ROWS * SQUARE_SIZE,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'relative',
              }}
              tabIndex={0}
            >
              {/* Snake */}
              {snake.map((seg, i) => (
                <div
                  key={i}
                  className={`snake-segment${i === 0 ? " snake-head" : ""}`}
                  style={{
                    left: seg.x * SQUARE_SIZE + SEGMENT_MARGIN,
                    top: seg.y * SQUARE_SIZE + SEGMENT_MARGIN,
                    width: SEGMENT_SIZE,
                    height: SEGMENT_SIZE,
                  }}
                />
              ))}
              {/* Food */}
              <div
                className="snake-food"
                style={{
                  left: food.x * SQUARE_SIZE + FOOD_MARGIN,
                  top: food.y * SQUARE_SIZE + FOOD_MARGIN,
                  width: FOOD_SIZE,
                  height: FOOD_SIZE,
                }}
              />
              {/* Grids */}
              {[...Array(BOARD_COLS - 1)].map((_, i) => (
                <div
                  key={"vgrid" + i}
                  className="snake-grid-line snake-grid-vert"
                  style={{ left: (i + 1) * SQUARE_SIZE, height: SQUARE_SIZE * BOARD_ROWS }}
                />
              ))}
              {[...Array(BOARD_ROWS - 1)].map((_, i) => (
                <div
                  key={"hgrid" + i}
                  className="snake-grid-line snake-grid-horiz"
                  style={{ top: (i + 1) * SQUARE_SIZE, width: SQUARE_SIZE * BOARD_COLS }}
                />
              ))}
            </div>
          </div>
          <div className="snake-panel">
            {!playing && !gameOver && !gamePaused && (
              <button onClick={startGame} className="snake-btn">Start</button>
            )}
            {playing && (
              <>
                <button onClick={stopGame} className="snake-btn snake-btn-stop">Stop</button>
                <button onClick={startGame} className="snake-btn">Restart</button>
              </>
            )}
            {gamePaused && !gameOver && (
              <>
                <button onClick={resumeGame} className="snake-btn">Resume</button>
                <button onClick={startGame} className="snake-btn">Restart</button>
              </>
            )}
            {gameOver && (
              <>
                <div className="snake-over-message">Game Over</div>
                <button onClick={startGame} className="snake-btn">Restart</button>
              </>
            )}
            {(playing || gamePaused) && (
              <>
                <div className="snake-instructions">
                  Use <kbd>↑</kbd> <kbd>←</kbd> <kbd>→</kbd> <kbd>↓</kbd> keys or tap the D-pad!
                </div>
                <div className="snake-controls-dpad">
                  <button
                    onClick={() => handleButtonDir("ArrowUp")}
                    aria-label="Up"
                    className="dir-btn up"
                  >
                    &#8593;
                  </button>
                  <div className="mid-row">
                    <button
                      onClick={() => handleButtonDir("ArrowLeft")}
                      aria-label="Left"
                      className="dir-btn left"
                    >
                      &#8592;
                    </button>
                    <span className="empty-dpad-cell"></span>
                    <button
                      onClick={() => handleButtonDir("ArrowRight")}
                      aria-label="Right"
                      className="dir-btn right"
                    >
                      &#8594;
                    </button>
                  </div>
                  <button
                    onClick={() => handleButtonDir("ArrowDown")}
                    aria-label="Down"
                    className="dir-btn down"
                  >
                    &#8595;
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="snake-footer">Classic Nokia Snake. Touch or keys!</div>
      </div>
    </div>
  );
};

export default Snake;
