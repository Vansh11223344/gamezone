import React, { useState, useEffect, useRef } from "react";
import "./MazeEscape.css";

const SIZE = 15; // 15x15 grid
const CELL = 32; // px, but true scale set by CSS

function generateMaze(size = SIZE) {
  // Mazes: 0 = wall, 1 = path
  let maze = Array.from({ length: size }, () =>
    Array(size).fill(0)
  );

  // Maze generation by depth-first search backtracking
  function carve(x, y) {
    maze[x][y] = 1;
    const dirs = [
      [0, 2],
      [2, 0],
      [0, -2],
      [-2, 0]
    ].sort(() => Math.random() - 0.5);
    for (let [dx, dy] of dirs) {
      let nx = x + dx,
        ny = y + dy;
      if (
        nx > 0 &&
        nx < size - 1 &&
        ny > 0 &&
        ny < size - 1 &&
        maze[nx][ny] === 0
      ) {
        maze[x + dx / 2][y + dy / 2] = 1;
        carve(nx, ny);
      }
    }
  }
  carve(1, 1);

  maze[1][1] = 2; // player
  maze[size - 2][size - 2] = 3; // goal
  return maze;
}

function findPos(maze, type) {
  for (let r = 0; r < maze.length; r++)
    for (let c = 0; c < maze[0].length; c++)
      if (maze[r][c] === type) return [r, c];
  return null;
}

export default function MazeEscape() {
  const [maze, setMaze] = useState(() => generateMaze());
  const [player, setPlayer] = useState(() => findPos(maze, 2));
  const [goal] = useState(() => findPos(maze, 3));
  const [moves, setMoves] = useState(0);
  const [escaped, setEscaped] = useState(false);

  // Movement handler
  function tryMove(dr, dc) {
    if (escaped) return;
    const [pr, pc] = player;
    const nr = pr + dr,
      nc = pc + dc;
    if (
      maze[nr]?.[nc] === 1 ||
      maze[nr]?.[nc] === 3 // open or goal
    ) {
      setPlayer([nr, nc]);
      setMoves((m) => m + 1);
      if (maze[nr][nc] === 3) setEscaped(true);
    }
  }

  // Keyboard controls
  useEffect(() => {
    function handle(e) {
      if (escaped) return;
      if (e.key === "ArrowUp") tryMove(-1, 0);
      if (e.key === "ArrowDown") tryMove(1, 0);
      if (e.key === "ArrowLeft") tryMove(0, -1);
      if (e.key === "ArrowRight") tryMove(0, 1);
      if (e.key === "r" || e.key === "R") restart();
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
    // eslint-disable-next-line
  }, [maze, player, escaped]);

  // Touch swipe controls
  const touchStart = useRef(null);
  function onTouchStart(e) {
    const t = e.touches[0];
    touchStart.current = [t.clientX, t.clientY];
  }
  function onTouchEnd(e) {
    if (!touchStart.current) return;
    const [sx, sy] = touchStart.current;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx,
      dy = t.clientY - sy;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 32) tryMove(0, 1);
      else if (dx < -32) tryMove(0, -1);
    } else {
      if (dy > 32) tryMove(1, 0);
      else if (dy < -32) tryMove(-1, 0);
    }
  }

  function restart() {
    const newMaze = generateMaze();
    setMaze(newMaze);
    setPlayer(findPos(newMaze, 2));
    setEscaped(false);
    setMoves(0);
  }

  // Render maze
  return (
    <div className="mazeescape-container">
      <h2 className="mazeescape-title">MazeEscape</h2>
      <div className="mazeescape-bar">
        <span>Moves: {moves}</span>
        <button className="mazeescape-btn" onClick={restart}>New Maze</button>
      </div>
      <div
        className="mazeescape-maze"
        style={{
          gridTemplateColumns: `repeat(${maze.length}, 1fr)`,
          gridTemplateRows: `repeat(${maze.length}, 1fr)`
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        tabIndex={0}
      >
        {maze.map((row, r) =>
          row.map((cell, c) => {
            let cellClass = "maze-cell";
            if (cell === 0) cellClass += " wall";
            if (cell === 1) cellClass += " floor";
            if (cell === 3) cellClass += " goal";
            if (player[0] === r && player[1] === c) cellClass += " player";
            return (
              <div
                key={r + "-" + c}
                className={cellClass}
                tabIndex={-1}
                aria-label={cell === 0 ? "Wall" : cell === 3 ? "Goal" : player[0] === r && player[1] === c ? "Player" : "Path"}
                style={{ width: CELL, height: CELL }}
              >
                {cell === 3 && <span className="maze-goal">★</span>}
                {player[0] === r && player[1] === c && (
                  <span className="maze-player-icon" />
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="mazeescape-controls">
        <span>
          <button className="maze-arrow" onClick={() => tryMove(-1, 0)} aria-label="Up">▲</button>
          <button className="maze-arrow" onClick={() => tryMove(0, -1)} aria-label="Left">◀</button>
          <button className="maze-arrow" onClick={() => tryMove(1, 0)} aria-label="Down">▼</button>
          <button className="maze-arrow" onClick={() => tryMove(0, 1)} aria-label="Right">▶</button>
        </span>
        <div className="mazeescape-instructions">
          Use arrow keys or tap arrows/swipe to move.  
          Escape the maze from <span className="maze-start-dot">●</span> to <span className="maze-goal-dot">★</span>!
        </div>
      </div>
      {escaped && (
        <div className="mazeescape-winmsg">
          <div>🎉 You Escaped! 🎉</div>
          <div>Moves: {moves}</div>
          <button className="mazeescape-btn" onClick={restart}>Play Again</button>
        </div>
      )}
    </div>
  );
}
