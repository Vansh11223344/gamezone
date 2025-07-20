import React, { useState } from "react";
import "./LightsOut.css";

const SIZE = 5; // 5x5 grid

function randomBoard() {
  // Board: true == light on, false == off
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => Math.random() > 0.5)
  );
}

function isSolved(board) {
  return board.every(row => row.every(cell => !cell));
}

function toggleCell(board, r, c) {
  const next = board.map(row => [...row]);
  const dirs = [
    [0, 0],
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0]
  ];
  for (const [dr, dc] of dirs) {
    let nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
      next[nr][nc] = !next[nr][nc];
    }
  }
  return next;
}

export default function LightsOut() {
  const [board, setBoard] = useState(randomBoard());
  const [moves, setMoves] = useState(0);
  const [win, setWin] = useState(isSolved(board));

  function handleClick(r, c) {
    if (win) return;
    const newBoard = toggleCell(board, r, c);
    setBoard(newBoard);
    setMoves(m => m + 1);
    if (isSolved(newBoard)) setWin(true);
  }

  function restart() {
    const b = randomBoard();
    setBoard(b);
    setMoves(0);
    setWin(isSolved(b));
  }

  return (
    <div className="lightsout-container">
      <div className="lightsout-title">Lights Out</div>
      <div className="lightsout-bar">
        <span>Moves: <b>{moves}</b></span>
        <button className="lightsout-btn" onClick={restart}>
          New Game
        </button>
      </div>
      <div
        className="lightsout-board"
        style={{
          gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${SIZE}, 1fr)`
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={r + "-" + c}
              className={
                "lightsout-cell" +
                (cell ? " on" : " off")
              }
              tabIndex={0}
              aria-label={cell ? "Lit" : "Unlit"}
              onClick={() => handleClick(r, c)}
              onKeyDown={e => {
                if (e.key === " " || e.key === "Enter") handleClick(r, c);
              }}
            />
          ))
        )}
      </div>
      {win && (
          <div className="lightsout-winbox">
          <div>🎉 You turned out all the lights!</div>
          <div>Moves: <b>{moves}</b></div>
          <button className="lightsout-btn" onClick={restart}>Play Again</button>
        </div>
      )}
      <div className="lightsout-description">
        <h3>How to Play</h3>
        <p>
          Your goal is to turn <span style={{ color: "#ffed4d" }}>off all the lights</span> on the grid.<br />
          <br />
          <strong>Click or tap any cell</strong> to switch that cell (and its neighbors) on or off.<br />
          Every move counts! Clear the board and win.<br /><br />
          You can also use the keyboard: press <b>Space</b> or <b>Enter</b> to toggle a focused cell.
        </p>
      </div>
    </div>
  );
}
