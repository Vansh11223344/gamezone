import React, { useState, useEffect } from "react";
import "./SlidingPuzzle.css";

const GRID = 4;
const N = GRID * GRID;

function isSolvable(numbers) {
  let inv = 0;
  for (let i = 0; i < N; i++) {
    if (numbers[i] === 0) continue;
    for (let j = i + 1; j < N; j++) {
      if (numbers[j] === 0) continue;
      if (numbers[i] > numbers[j]) inv++;
    }
  }
  const blankRowFromBottom = GRID - Math.floor(numbers.indexOf(0) / GRID);
  if (GRID % 2) return inv % 2 === 0;
  else return (inv + blankRowFromBottom) % 2 === 0;
}

function shuffleBoard() {
  let arr;
  do {
    arr = Array.from({ length: N }, (_, i) => i);
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } while (!isSolvable(arr) || isSolved(arr));
  return arr;
}

function isSolved(arr) {
  for (let i = 0; i < N - 1; i++) {
    if (arr[i] !== i + 1) return false;
  }
  return arr[N - 1] === 0;
}

function getNeighbourIdx(emptyIdx) {
  const moves = [];
  const row = Math.floor(emptyIdx / GRID), col = emptyIdx % GRID;
  if (row > 0) moves.push(emptyIdx - GRID);
  if (row < GRID - 1) moves.push(emptyIdx + GRID);
  if (col > 0) moves.push(emptyIdx - 1);
  if (col < GRID - 1) moves.push(emptyIdx + 1);
  return moves;
}

export default function SlidingPuzzle() {
  const [tiles, setTiles] = useState(shuffleBoard());
  const [moves, setMoves] = useState(0);
  const [win, setWin] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (win) return;
      const idx = tiles.indexOf(0);
      let moveTo;
      if (e.key === "ArrowUp" && idx + GRID < N) moveTo = idx + GRID;
      if (e.key === "ArrowDown" && idx - GRID >= 0) moveTo = idx - GRID;
      if (e.key === "ArrowLeft" && idx % GRID < GRID - 1) moveTo = idx + 1;
      if (e.key === "ArrowRight" && idx % GRID > 0) moveTo = idx - 1;
      if (moveTo !== undefined) moveTile(moveTo);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [tiles, win]);

  function moveTile(i) {
    if (win) return;
    const empty = tiles.indexOf(0);
    const valids = getNeighbourIdx(empty);
    if (!valids.includes(i)) return;
    const newTiles = tiles.slice();
    [newTiles[empty], newTiles[i]] = [newTiles[i], newTiles[empty]];
    setTiles(newTiles);
    setMoves(m => m + 1);
    if (isSolved(newTiles)) setWin(true);
  }

  function startNew() {
    const arr = shuffleBoard();
    setTiles(arr);
    setMoves(0);
    setWin(false);
  }

  // For touch/mouse drag tile movement:
  let dragState = {};
  function handleTileTouchStart(i, e) {
    const evt = e.touches?.[0] || e;
    dragState.startIdx = i;
    dragState.startX = evt.clientX;
    dragState.startY = evt.clientY;
  }
  function handleTileTouchEnd(i, e) {
    const evt = e.changedTouches?.[0] || e;
    const dx = evt.clientX - dragState.startX;
    const dy = evt.clientY - dragState.startY;
    const absX = Math.abs(dx), absY = Math.abs(dy);
    const empty = tiles.indexOf(0);
    const valid = getNeighbourIdx(empty).includes(i);
    if (!valid) return;
    // Direction
    if (absX > absY && absX > 18) {
      // horizontal
      if (dx < 0 && empty === i + 1) moveTile(i); // left drag, empty right
      if (dx > 0 && empty === i - 1) moveTile(i); // right drag, empty left
    }
    if (absY > absX && absY > 18) {
      if (dy < 0 && empty === i + GRID) moveTile(i); // up drag, empty below
      if (dy > 0 && empty === i - GRID) moveTile(i); // down drag, empty above
    }
  }

  return (
    <div className="spuzzle-container">
      <h2 className="spuzzle-title">Sliding Puzzle</h2>
      <div className="spuzzle-bar">
        <button className="spuzzle-btn" onClick={startNew}>New Game</button>
        <span>Moves: <strong>{moves}</strong></span>
      </div>
      <div
        className={"spuzzle-grid" + (win ? " spuzzle-win" : "")}
        style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}
      >
        {tiles.map((n, idx) => (
          <div
            key={n === 0 ? "empty" : n}
            className={
              "spuzzle-tile" +
              (n === 0 ? " spuzzle-empty" : "") +
              (win && n !== 0 ? " spuzzle-glow" : "")
            }
            onClick={() => n !== 0 && moveTile(idx)}
            onTouchStart={e => n !== 0 && handleTileTouchStart(idx, e)}
            onTouchEnd={e => n !== 0 && handleTileTouchEnd(idx, e)}
            draggable={false}
            tabIndex={n !== 0 ? 0 : -1}
            aria-label={n === 0 ? "Blank" : `Tile ${n}`}
          >
            {n !== 0 && <span>{n}</span>}
          </div>
        ))}
      </div>
      {win && (
        <div className="spuzzle-msg" role="alert" aria-live="assertive">
          🎉 Puzzle solved in <b>{moves}</b> moves! <button className="spuzzle-btn" onClick={startNew}>Play Again</button>
        </div>
      )}
      <div className="spuzzle-footer">
        <span>Classic 15-Puzzle</span>
      </div>
    </div>
  );
}