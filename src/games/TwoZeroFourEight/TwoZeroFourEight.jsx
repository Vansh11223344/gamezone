import React, { useEffect, useState, useCallback } from "react";
import "./TwoZeroFourEight.css";

const SIZE = 4;

function getEmptyBoard() {
  return Array(SIZE)
    .fill(0)
    .map(() => Array(SIZE).fill(null));
}
function getRandomEmpty(board) {
  let empties = [];
  for (let r = 0; r < SIZE; ++r)
    for (let c = 0; c < SIZE; ++c)
      if (!board[r][c]) empties.push([r, c]);
  return empties[Math.floor(Math.random() * empties.length)];
}
function getNewTileValue() {
  // 10% for 4, else 2
  return Math.random() < 0.1 ? 4 : 2;
}
function addRandomTile(board) {
  const empty = getRandomEmpty(board);
  if (!empty) return board;
  const [r, c] = empty;
  const copy = board.map(row => [...row]);
  copy[r][c] = getNewTileValue();
  return copy;
}
function moveLeft(board) {
  let moved = false, mergedBoard = board.map(row => [...row]);
  let score = 0;
  for (let r = 0; r < SIZE; ++r) {
    let line = mergedBoard[r].filter(x => x);
    for (let i = 0; i < line.length - 1; ++i) {
      if (line[i] && line[i] === line[i + 1]) {
        line[i] *= 2;
        score += line[i];
        line[i + 1] = null;
        i++; // Skip next
      }
    }
    let newLine = line.filter(x => x);
    while (newLine.length < SIZE) newLine.push(null);
    if (JSON.stringify(newLine) !== JSON.stringify(mergedBoard[r])) moved = true;
    mergedBoard[r] = newLine;
  }
  return { board: mergedBoard, moved, score };
}
function moveRight(board) {
  let reversed = board.map(row => row.slice().reverse());
  let res = moveLeft(reversed);
  res.board = res.board.map(row => row.reverse());
  return res;
}
function moveUp(board) {
  let cols = Array(SIZE)
    .fill(0)
    .map((_, c) => board.map(row => row[c]));
  let rowsAfter = [];
  let moved = false, score = 0;
  for (let c = 0; c < SIZE; ++c) {
    let line = cols[c].filter(x => x);
    for (let i = 0; i < line.length - 1; ++i) {
      if (line[i] && line[i] === line[i + 1]) {
        line[i] *= 2;
        score += line[i];
        line[i + 1] = null;
        i++;
      }
    }
    let newLine = line.filter(x => x);
    while (newLine.length < SIZE) newLine.push(null);
    if (JSON.stringify(newLine) !== JSON.stringify(cols[c])) moved = true;
    rowsAfter.push(newLine);
  }
  let merged = Array(SIZE)
    .fill(0)
    .map(() => Array(SIZE));
  for (let r = 0; r < SIZE; ++r) for (let c = 0; c < SIZE; ++c) merged[r][c] = rowsAfter[c][r];
  return { board: merged, moved, score };
}
function moveDown(board) {
  let reversedCols = Array(SIZE)
    .fill(0)
    .map((_, c) =>
      board.map(row => row[c]).slice().reverse()
    );
  let rowsAfter = [];
  let moved = false, score = 0;
  for (let c = 0; c < SIZE; ++c) {
    let line = reversedCols[c].filter(x => x);
    for (let i = 0; i < line.length - 1; ++i) {
      if (line[i] && line[i] === line[i + 1]) {
        line[i] *= 2;
        score += line[i];
        line[i + 1] = null;
        i++;
      }
    }
    let newLine = line.filter(x => x);
    while (newLine.length < SIZE) newLine.push(null);
    if (JSON.stringify(newLine) !== JSON.stringify(reversedCols[c])) moved = true;
    rowsAfter.push(newLine);
  }
  let merged = Array(SIZE)
    .fill(0)
    .map(() => Array(SIZE));
  for (let r = 0; r < SIZE; ++r)
    for (let c = 0; c < SIZE; ++c)
      merged[r][c] = rowsAfter[c][SIZE - 1 - r];
  return { board: merged, moved, score };
}
function isFull(board) {
  for (let r = 0; r < SIZE; ++r)
    for (let c = 0; c < SIZE; ++c)
      if (!board[r][c]) return false;
  return true;
}
function movesAvailable(board) {
  if (!isFull(board)) return true;
  for (let r = 0; r < SIZE; ++r) {
    for (let c = 0; c < SIZE; ++c) {
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}
function any2048(board) {
  return board.flat().includes(2048);
}

// Touch swipe helper
function useSwipe(onSwipe) {
  const [touch, setTouch] = useState(null);
  useEffect(() => {
    function handleTouchStart(e) {
      setTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
    function handleTouchEnd(e) {
      if (!touch) return;
      let dx = e.changedTouches[0].clientX - touch.x;
      let dy = e.changedTouches[0].clientY - touch.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        onSwipe(dx > 0 ? "right" : "left");
      } else if (Math.abs(dy) > 40) {
        onSwipe(dy > 0 ? "down" : "up");
      }
      setTouch(null);
    }
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [touch, onSwipe]);
}

export default function TwoZeroFourEight() {
  const [board, setBoard] = useState(() =>
    addRandomTile(addRandomTile(getEmptyBoard()))
  );
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);

  // Keyboard and swipe
  const move = useCallback(
    dir => {
      if (won || lost) return;
      let op, res;
      if (dir === "left") op = moveLeft;
      else if (dir === "right") op = moveRight;
      else if (dir === "up") op = moveUp;
      else op = moveDown;
      res = op(board);
      if (res.moved) {
        let nb = addRandomTile(res.board);
        setBoard(nb);
        setScore(s => s + res.score);
      }
    },
    [board, won, lost]
  );

  useEffect(() => {
    function onKey(e) {
      if (["ArrowLeft", "a"].includes(e.key)) move("left");
      else if (["ArrowUp", "w"].includes(e.key)) move("up");
      else if (["ArrowRight", "d"].includes(e.key)) move("right");
      else if (["ArrowDown", "s"].includes(e.key)) move("down");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  useSwipe(dir => move(dir));

  // Win/loss checking
  useEffect(() => {
    if (!won && any2048(board)) setWon(true);
    else if (!movesAvailable(board)) setLost(true);
  }, [board, won]);

  function restart() {
    setBoard(addRandomTile(addRandomTile(getEmptyBoard())));
    setScore(0);
    setWon(false);
    setLost(false);
  }

  // Arrow controls for phones/desktop
  function handleArrow(dir) {
    move(dir);
  }

  return (
    <div className="game2048-outer">
      <div className="game2048-title">2048</div>
      <div className="game2048-controls">
        <div className="game2048-scorebox">
          <span className="game2048-score-label">Score</span>
          <span className="game2048-score">{score}</span>
        </div>
        <button className="game2048-btn" onClick={restart}>{(won || lost) ? "New Game" : "Restart"}</button>
      </div>
      <div className="game2048-board-cont">
        <div className="game2048-board">
          {board.map((row, r) =>
            row.map((cell, c) => (
              <div className={"game2048-cell" + (cell ? " v" + cell : "")} key={r + "-" + c}>
                {cell && <span>{cell}</span>}
              </div>
            ))
          )}
        </div>
        {won && (
          <div className="game2048-overlay won">
            <b>🎉 You Win! 🎉</b>
            <button className="game2048-btn" onClick={restart}>Play Again</button>
          </div>
        )}
        {lost && (
          <div className="game2048-overlay lose">
            <b>😢 Game Over</b>
            <button className="game2048-btn" onClick={restart}>Try Again</button>
          </div>
        )}
      </div>
      {/* Up/Down/Left/Right controls, always visible on mobile */}
      <div className="game2048-arrows">
        <div className="game2048-arrows-up">
          <button aria-label="Up" onClick={() => handleArrow("up")}>&#8679;</button>
        </div>
        <div className="game2048-arrows-mid">
          <button aria-label="Left" onClick={() => handleArrow("left")}>&#8678;</button>
          <button aria-label="Down" onClick={() => handleArrow("down")}>&#8681;</button>
          <button aria-label="Right" onClick={() => handleArrow("right")}>&#8680;</button>
        </div>
      </div>
      <div className="game2048-help">
        <b>How to play:</b> Tap arrows, swipe, or use arrow/WASD keys.<br/>
        When two tiles with the same number touch, they merge.<br/>
        Get to <span style={{color:'#edc403'}}>2048</span> to win.
      </div>
    </div>
  );
}
