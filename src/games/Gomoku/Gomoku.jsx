import React, { useState } from "react";
import "./Gomoku.css";

const SIZE = 15; // 15x15 board

const EMPTY = 0, BLACK = 1, WHITE = 2;

function makeBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
}

function checkWinner(board, lastMove) {
  if (!lastMove) return null;
  const [row, col, player] = lastMove;
  const dirs = [
    [1, 0], [0, 1], [1, 1], [1, -1]
  ];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (let d = 1; d <= 4; d++) {
      let r = row + dr * d, c = col + dc * d;
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) break;
      if (board[r][c] === player) count++; else break;
    }
    for (let d = 1; d <= 4; d++) {
      let r = row - dr * d, c = col - dc * d;
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) break;
      if (board[r][c] === player) count++; else break;
    }
    if (count >= 5) return player;
  }
  return null;
}

function isBoardFull(board) {
  return board.every(row => row.every(cell => cell !== EMPTY));
}

export default function Gomoku() {
  const [board, setBoard] = useState(makeBoard());
  const [turn, setTurn] = useState(BLACK);
  const [winner, setWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  function handleCellClick(r, c) {
    if (winner) return;
    if (board[r][c] !== EMPTY) return;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = turn;
    setBoard(newBoard);
    setLastMove([r, c, turn]);
    const win = checkWinner(newBoard, [r, c, turn]);
    if (win) setWinner(win);
    else if (isBoardFull(newBoard)) setWinner("draw");
    setTurn(turn === BLACK ? WHITE : BLACK);
  }

  function restart() {
    setBoard(makeBoard());
    setTurn(BLACK);
    setWinner(null);
    setLastMove(null);
  }

  return (
    <div className="gomoku-container">
      <div className="gomoku-title">Gomoku</div>
      <div className="gomoku-bar">
        <span>
          <span className="gomoku-stone black" /> Black
          <span className="gomoku-stone white" /> White
        </span>
        <button className="gomoku-btn" onClick={restart}>Restart</button>
        <span className="gomoku-status">
          {winner === BLACK && "Black wins!"}
          {winner === WHITE && "White wins!"}
          {winner === "draw" && "Draw"}
          {!winner && (turn === BLACK ? "Black's turn" : "White's turn")}
        </span>
      </div>
      <div
        className="gomoku-board"
        style={{
          gridTemplateRows: `repeat(${SIZE}, 1fr)`,
          gridTemplateColumns: `repeat(${SIZE}, 1fr)`
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isLast = lastMove && r === lastMove[0] && c === lastMove[1];
            return (
              <div
                key={`${r}-${c}`}
                className={"gomoku-cell" + (isLast ? " last-move" : "")}
                onClick={() => handleCellClick(r, c)}
                tabIndex={0}
                aria-label={
                  cell === BLACK
                    ? "Black stone"
                    : cell === WHITE
                      ? "White stone"
                      : "Empty"
                }
              >
                {cell === BLACK && <div className="gomoku-stone black" />}
                {cell === WHITE && <div className="gomoku-stone white" />}
                {isLast && !!cell && <div className="gomoku-last-mark" />}
              </div>
            );
          })
        )}
      </div>
      <div className="gomoku-footer">
        Classic Gomoku &mdash; Five in a Row
      </div>
    </div>
  );
}
