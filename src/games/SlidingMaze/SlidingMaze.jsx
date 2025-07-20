import React, { useState, useRef, useEffect } from "react";
import "./SlidingMaze.css";

const SIZE = 5;  // 5x5 grid
const BLOCK = 70; // cell pixel size for canvas

function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// Directions
const DIRS = [
  [0,1],
  [1,0],
  [0,-1],
  [-1,0]
];

// Generate a "perfect" maze, i.e. one path start->goal, all others walls;
// then randomize blocks by shuffling rows and columns.
function generateMaze(size = SIZE) {
  // 0: wall, 1: path
  let grid = Array.from({length: size}, () => Array(size).fill(0));
  let solution = [];
  // Make sure: Start at top-left, goal at bottom-right
  let r=0, c=0;
  grid[r][c]=1; solution.push([r,c]);
  let length = size*size - getRandomInt(2) - 4;
  for (let i=0;i<length;i++) {
    let choices = DIRS
      .map(([dr,dc])=>[r+dr, c+dc])
      .filter(([nr,nc]) => 
        nr>=0 && nr<size && nc>=0 && nc<size && grid[nr][nc]===0
      );
    if (!choices.length) break;
    let [nr, nc] = choices[getRandomInt(choices.length)];
    grid[nr][nc]=1; solution.push([nr,nc]);
    r = nr; c = nc;
  }
  // Always end at bottom-right
  grid[size-1][size-1]=1; if (solution[solution.length-1][0]!==size-1 || solution[solution.length-1][1]!==size-1) solution.push([size-1,size-1]);
  // Now fill rest with random path/wall
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)
    if(grid[r][c]===0) grid[r][c]=Math.random() < 0.27 ? 1 : 0;
  // Record start/goal
  let start = solution[0], goal = [size-1,size-1];

  // shuffle rows and cols a random number of times to create a "sliding maze"
  let maze = deepCopy(grid);
  for(let t=0;t<10+getRandomInt(20);t++) {
    if(Math.random()<0.5){
      let row = getRandomInt(size);
      let dir = Math.random()<0.5?1:-1;
      if(dir>0){
        let hold=maze[row][size-1];
        for(let c=size-1;c>0;c--)maze[row][c]=maze[row][c-1];
        maze[row][0]=hold;
      }else{
        let hold=maze[row][0];
        for(let c=0;c<size-1;c++)maze[row][c]=maze[row][c+1];
        maze[row][size-1]=hold;
      }
    }else{
      let col = getRandomInt(size);
      let dir = Math.random()<0.5?1:-1;
      if(dir>0){
        let hold=maze[size-1][col];
        for(let r=size-1;r>0;r--)maze[r][col]=maze[r-1][col];
        maze[0][col]=hold;
      }else{
        let hold=maze[0][col];
        for(let r=0;r<size-1;r++)maze[r][col]=maze[r+1][col];
        maze[size-1][col]=hold;
      }
    }
  }

  // Place ball at START's current position
  let sPos = {r:0, c:0};
  let gPos = {r:0, c:0};
  // Find where [0,0] and [size-1,size-1] ended up:
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    if(maze[r][c]===grid[0][0] && grid[0][0]===1 && solution[0][0]===0 && solution[0][1]===0 && r!==size-1&&c!==size-1){
      sPos = {r, c};
    }
    // For goal, always actual goal cell [size-1,size-1]:
    if(grid[size-1][size-1]===1 && maze[r][c]===1 &&
    (r===size-1&&c===size-1)) gPos={r,c};
  }
  // Actually, set START to where [0,0] WAS (which is now at *some* (r,c))
  sPos = {r:0, c:0};
  gPos = {r: size-1, c: size-1};

  // But so it always works, just find the tile which has the top-left path and bottom-right path:
  main:for(let r=0; r<size; r++)for(let c=0; c<size;c++){
    if(grid[0][0]===maze[r][c] && solution[0][0]===0 && solution[0][1]===0) { sPos={r, c}; break main; }
  }
  main2:for(let r=0; r<size; r++)for(let c=0; c<size;c++){
    if(grid[size-1][size-1]===maze[r][c] && (r===size-1||c===size-1)) { gPos={r, c}; break main2; }
  }

  return {
    original:grid,
    maze: maze,
    start: sPos,  // top-left's path new position
    goal: gPos,
  };
}

function canMove(maze, pos, dir) {
  // Can move ball to this direction? Path must exist.
  const [dr, dc] = DIRS[dir];
  const nr = pos.r + dr, nc = pos.c + dc;
  if (nr >= 0 && nc >= 0 && nr < SIZE && nc < SIZE && maze[nr][nc] === 1) {
    return { r: nr, c: nc };
  }
  return null;
}

// Move row/col left/right/up/down -- direction: -1 or +1
function slide(maze, idx, isRow, dir) {
  let newMaze = maze.map(row => [...row]);
  if (isRow) {
    if (dir > 0) {
      // Right
      let last = newMaze[idx][SIZE - 1];
      for (let c = SIZE - 1; c > 0; c--) newMaze[idx][c] = newMaze[idx][c - 1];
      newMaze[idx][0] = last;
    } else {
      // Left
      let first = newMaze[idx][0];
      for (let c = 0; c < SIZE - 1; c++) newMaze[idx][c] = newMaze[idx][c + 1];
      newMaze[idx][SIZE - 1] = first;
    }
  } else {
    if (dir > 0) {
      // Down
      let last = newMaze[SIZE - 1][idx];
      for (let r = SIZE - 1; r > 0; r--) newMaze[r][idx] = newMaze[r - 1][idx];
      newMaze[0][idx] = last;
    } else {
      // Up
      let first = newMaze[0][idx];
      for (let r = 0; r < SIZE - 1; r++) newMaze[r][idx] = newMaze[r + 1][idx];
      newMaze[SIZE - 1][idx] = first;
    }
  }
  return newMaze;
}

export default function SlidingMaze() {
  const [{ maze, start, goal }, setMazeObj] = useState(generateMaze());
  const [ball, setBall] = useState({ ...start });
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef();

  useEffect(() => {
    if (won) return;
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [won]);

  function restart() {
    const nmaze = generateMaze();
    setMazeObj(nmaze);
    setBall({ ...nmaze.start });
    setMoves(0);
    setTimer(0);
    setWon(false);
  }

  function tryMove(dir) {
    if (won) return;
    const next = canMove(maze, ball, dir);
    if (next) {
      setBall(next);
      setMoves(m => m + 1);
      if (next.r === goal.r && next.c === goal.c) setWon(true);
    }
  }

  function doSlide(idx, isRow, dir) {
    if (won) return;
    // Where ball will be after this shift?
    let newMaze = slide(maze, idx, isRow, dir);
    let newBall = { ...ball };
    if (isRow && idx === ball.r) {
      // Ball moves with row
      newBall.c = (ball.c + (dir > 0 ? SIZE - 1 : 1)) % SIZE;
    } else if (!isRow && idx === ball.c) {
      newBall.r = (ball.r + (dir > 0 ? SIZE - 1 : 1)) % SIZE;
    }
    setMazeObj(m => ({ ...m, maze: newMaze }));
    setBall(newBall);
    setMoves(m => m + 1);
    if (newBall.r === goal.r && newBall.c === goal.c) setWon(true);
  }

  // Keyboard for arrow keys
  useEffect(() => {
    function handle(e) {
      if (document.activeElement && document.activeElement.tagName === "INPUT") return;
      if (e.key === "ArrowUp") tryMove(3);
      if (e.key === "ArrowDown") tryMove(1);
      if (e.key === "ArrowLeft") tryMove(2);
      if (e.key === "ArrowRight") tryMove(0);
      if (e.key === "r" || e.key === "R") restart();
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
    // eslint-disable-next-line
  }, [maze, ball, goal, won]);

  // Touch/drag for sliding rows/cols
  const drag = useRef({ active: false, row: null, col: null, startX: 0, startY: 0, dir: null });

  function onTileTouchStart(e, r, c) {
    drag.current.active = true;
    drag.current.row = r;
    drag.current.col = c;
    drag.current.startX = e.touches ? e.touches[0].clientX : e.clientX;
    drag.current.startY = e.touches ? e.touches[0].clientY : e.clientY;
    drag.current.dir = null;
  }
  function onTileTouchMove(e) {
    if (!drag.current.active) return;
    let x = e.touches ? e.touches[0].clientX : e.clientX;
    let y = e.touches ? e.touches[0].clientY : e.clientY;
    let dx = x - drag.current.startX;
    let dy = y - drag.current.startY;
    if (Math.abs(dx) > 34 || Math.abs(dy) > 34) {
      // Decide dir
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) doSlide(drag.current.row, true, 1);
        else doSlide(drag.current.row, true, -1);
      } else {
        if (dy > 0) doSlide(drag.current.col, false, 1);
        else doSlide(drag.current.col, false, -1);
      }
      drag.current.active = false;
    }
  }
  function onTileTouchEnd() {
    drag.current.active = false;
  }

  // For display scale/size
  const cellSz = Math.round(Math.min(80, Math.max(32, (window.innerWidth-32)/SIZE)));

  return (
    <div className="slidingmaze-container">
      <h2 className="slidingmaze-title">
        Sliding Maze
      </h2>
      <div className="slidingmaze-info">
        <span>⏱ {timer}s</span>
        <span>Moves: {moves}</span>
        <button className="slidingmaze-btn" onClick={restart}>Restart</button>
      </div>
      <div
        className="slidingmaze-grid"
        style={{
          gridTemplateColumns: `repeat(${SIZE}, ${cellSz}px)`,
          gridTemplateRows: `repeat(${SIZE}, ${cellSz}px)`
        }}
        onMouseMove={onTileTouchMove}
        onMouseUp={onTileTouchEnd}
        onMouseLeave={onTileTouchEnd}
        onTouchMove={onTileTouchMove}
        onTouchEnd={onTileTouchEnd}
        tabIndex={0}
      >
        {maze.map((row, r) =>
          row.map((cell, c) => {
            const isGoal = (r === goal.r && c === goal.c);
            const isBall = (r === ball.r && c === ball.c);
            const isStart = (r === start.r && c === start.c);
            return (
              <div
                key={r + "-" + c}
                className={
                  "slidingmaze-cell" +
                  (cell ? "" : " wall") +
                  (isGoal ? " goal" : "") +
                  (isStart ? " start" : "") +
                  (isBall ? " ball" : "")
                }
                onMouseDown={e => onTileTouchStart(e, r, c)}
                onTouchStart={e => onTileTouchStart(e, r, c)}
                tabIndex={0}
                aria-label={isBall ? "Player" : isGoal ? "Goal" : cell ? "Path" : "Wall"}
              >
                {isGoal && <span className="slidingmaze-goal-icon">🏁</span>}
                {isStart && <span className="slidingmaze-start-icon">🟢</span>}
                {isBall && <span className="slidingmaze-ball-icon" />}
              </div>
            );
          })
        )}
      </div>
      <div className="slidingmaze-controls">
        <span>
          <b>←</b>
          <button className="slbtn" onClick={() => tryMove(2)}>&larr;</button>
          <button className="slbtn" onClick={() => tryMove(1)}>&darr;</button>
          <button className="slbtn" onClick={() => tryMove(0)}>&rarr;</button>
          <button className="slbtn" onClick={() => tryMove(3)}>&uarr;</button>
          <b>→</b>
        </span>
        <div style={{ fontSize: '.97rem', marginTop: 7, color: '#69adc7cc' }}>
          <span>Tap/drag row or column to slide.<br />Move ball <b>🟥</b> to <b>🏁</b> Goal!</span>
        </div>
      </div>
      {won && (
        <div className="slidingmaze-winbox">
          <div>🎉 Maze Solved!</div>
          <div>Time: {timer}s &nbsp; Moves: {moves}</div>
          <button className="slidingmaze-btn" onClick={restart}>Play Again</button>
        </div>
      )}
    </div>
  );
}
