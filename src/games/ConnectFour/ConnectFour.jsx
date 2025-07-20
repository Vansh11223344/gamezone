import React, { useState, useEffect } from "react";
import "./ConnectFour.css";

const ROWS = 6;
const COLS = 7;

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

export default function ConnectFour() {
  const [mode, setMode] = useState(null); // null | "2p" | "cpu"
  const [board, setBoard] = useState(emptyBoard());
  const [turn, setTurn] = useState(1); // 1 = Red, 2 = Yellow
  const [winner, setWinner] = useState(null); // 0=Draw, 1=Red/You, 2=Yellow/CPU
  const [anim, setAnim] = useState({ col: null, row: null });

  useEffect(() => {
    if (mode === "cpu" && turn === 2 && !winner) {
      const valid = getValidCols(board);
      if (!valid.length) return;
      const col = valid[Math.floor(Math.random() * valid.length)];
      setTimeout(() => doMove(col), 600);
    }
    // eslint-disable-next-line
  }, [mode, turn, board, winner]);

  function getDropRow(bd, col) {
    for (let r = ROWS - 1; r >= 0; --r) if (!bd[r][col]) return r;
    return -1;
  }

  function getValidCols(bd) {
    return Array.from({ length: COLS }, (_, i) => i).filter(c => bd[0][c] === 0);
  }

  function doMove(col) {
    if (winner || (mode === "cpu" && turn === 2)) return;
    const row = getDropRow(board, col);
    if (row < 0) return;
    const newBoard = board.map(arr => [...arr]);
    newBoard[row][col] = turn;

    setAnim({ col, row });
    setTimeout(() => {
      setAnim({ col: null, row: null });
      setBoard(newBoard);
      const win = checkWinner(newBoard, row, col, turn);
      if (win) {
        setWinner(turn);
      } else if (newBoard.every(r => r.every(cell => cell !== 0))) {
        setWinner(0);
      } else {
        setTurn(turn === 1 ? 2 : 1);
      }
    }, 260);
  }

  function handleReset(selectedMode = mode) {
    setBoard(emptyBoard());
    setTurn(1);
    setWinner(null);
    setAnim({ col: null, row: null });
    setMode(selectedMode);
  }

  function checkWinner(bd, row, col, color) {
    function ct(dx, dy) {
      let r = row + dx, c = col + dy, n = 0;
      while (
        r >= 0 &&
        r < ROWS &&
        c >= 0 &&
        c < COLS &&
        bd[r][c] === color
      ) {
        n++;
        r += dx;
        c += dy;
      }
      return n;
    }
    const dirs = [
      [1, 0], // vertical
      [0, 1], // horizontal
      [1, 1], // diag bottom right
      [1, -1], // diag bottom left
    ];
    for (const [dr, dc] of dirs) {
      let total = 1 + ct(dr, dc) + ct(-dr, -dc);
      if (total >= 4) return true;
    }
    return false;
  }

  return (
    <div className="cf4-app">
      <div className="cf4-title">
        <span className="cf4-logo">🟦</span> Connect Four
      </div>

      {!mode ? (
        <div className="cf4-modal">
          <h2>Connect Four</h2>
          <button className="cf4-btn" onClick={() => setMode("2p")}>
            2 Player
          </button>
          <button className="cf4-btn" onClick={() => setMode("cpu")}>
            Player vs Computer
          </button>
        </div>
      ) : (
        <>
          <div className="cf4-bar">
            <div
              className={
                "cf4-turn " +
                (winner
                  ? "cf4-won"
                  : turn === 1
                  ? "cf4-red"
                  : "cf4-yellow")
              }
            >
              {winner === 0
                ? "Draw!"
                : winner === 1
                ? mode === "2p"
                  ? "Red wins!"
                  : "You win!"
                : winner === 2
                ? mode === "2p"
                  ? "Yellow wins!"
                  : "Computer wins!"
                : (
                  <>
                    Turn:
                    <span className={turn === 1 ? "cf4-red" : "cf4-yellow"}>
                      {' '}
                      {mode === "2p"
                        ? turn === 1
                          ? "Red"
                          : "Yellow"
                        : turn === 1
                        ? "You (Red)"
                        : "Computer (Yellow)"}
                    </span>
                  </>
                )}
            </div>
            <button
              className="cf4-btn cf4-sm"
              style={{ marginLeft: 18 }}
              onClick={() => handleReset()}
            >
              {winner ? "Play Again" : "Reset"}
            </button>
            <button className="cf4-btn cf4-sm" onClick={() => handleReset(null)}>
              Menu
            </button>
          </div>
          <ConnectFourGrid
            board={board}
            anim={anim}
            winner={winner}
            allowClick={(mode === "cpu" && turn !== 1) ? false : true}
            drop={doMove}
          />
          <div className="cf4-legend">
            <span className="cf4-red cf4-disk-demo"></span> Red &nbsp;|&nbsp;
            <span className="cf4-yellow cf4-disk-demo"></span> Yellow &nbsp;|&nbsp;
            <span>Click a column to drop your disc!</span>
          </div>
        </>
      )}
    </div>
  );
}

function ConnectFourGrid({ board, anim, winner, allowClick, drop }) {
  return (
    <div className="cf4-boardwrap">
      <div className="cf4-shadow"></div>
      <div className="cf4-grid">
        {/* Large clickable columns for disc drop */}
        <div className="cf4-clickrow">
          {Array.from({ length: COLS }, (_, c) => (
            <button
              key={c}
              className={
                "cf4-colbtn" + (anim.col === c ? " cf4-anim" : "")
              }
              aria-label={`Drop disc in column ${c + 1}`}
              onClick={() => allowClick && !winner && drop(c)}
              disabled={!!winner || board[0][c] !== 0 || !allowClick}
            />
          ))}
        </div>
        {/* Grid slots */}
        {board.map((row, r) => (
          <div className="cf4-row" key={r}>
            {row.map((cell, c) => (
              <div className="cf4-cell" key={c}>
                {cell ? (
                  <div
                    className={
                      "cf4-disk " +
                      (cell === 1 ? "cf4-red" : "cf4-yellow") +
                      (anim.col === c && anim.row === r ? " cf4-falldown" : "")
                    }
                  />
                ) : (
                  <div className="cf4-hole"></div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
