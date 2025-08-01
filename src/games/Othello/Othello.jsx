import React, { useState } from "react";
import "./Othello.css";

const SIZE = 8;

// Board values
const EMPTY = 0, BLACK = 1, WHITE = 2;

const directions = [
  [0, 1], [1, 0], [1, 1], [-1, 0],
  [0, -1], [-1, -1], [-1, 1], [1, -1]
];

function createBoard() {
  // Creates the initial 8x8 othello board
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  board[3][3] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][4] = WHITE;
  return board;
}

function cloneBoard(board) {
  return board.map(row => [...row]);
}

function getOpponent(player) {
  return player === BLACK ? WHITE : BLACK;
}

function getFlips(board, row, col, player) {
  if (board[row][col] !== EMPTY) return [];
  let flips = [];
  for (let [dr, dc] of directions) {
    let r = row + dr, c = col + dc;
    let possible = [];
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === getOpponent(player)) {
      possible.push([r, c]);
      r += dr;
      c += dc;
    }
    if (possible.length && r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) {
      flips.push(...possible);
    }
  }
  return flips;
}

function getValidMoves(board, player) {
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (getFlips(board, r, c, player).length) moves.push([r, c]);
    }
  }
  return moves;
}

function countDiscs(board) {
  let black = 0, white = 0;
  for (let row of board) {
    for (let cell of row) {
      if (cell === BLACK) black++;
      else if (cell === WHITE) white++;
    }
  }
  return { black, white };
}

export default function Othello() {
  const [board, setBoard] = useState(createBoard());
  const [current, setCurrent] = useState(BLACK);
  const [status, setStatus] = useState("");
  const [lastMove, setLastMove] = useState(null);

  const validMoves = getValidMoves(board, current);

  const handleCellClick = (r, c) => {
    if (status) return;
    if (getFlips(board, r, c, current).length === 0) return;
    const newBoard = cloneBoard(board);
    newBoard[r][c] = current;
    getFlips(board, r, c, current).forEach(([fr, fc]) => {
      newBoard[fr][fc] = current;
    });

    const next = getOpponent(current);
    const nextValid = getValidMoves(newBoard, next);

    let msg = "";
    if (!nextValid.length) {
      const again = getValidMoves(newBoard, current);
      if (!again.length) {
        const { black, white } = countDiscs(newBoard);
        if (black > white) msg = "Black wins!";
        else if (white > black) msg = "White wins!";
        else msg = "Draw!";
      } else {
        msg = (next === BLACK ? "Black" : "White") + " has no moves, turn passes.";
      }
    }
    setBoard(newBoard);
    setStatus(msg);
    setLastMove([r, c]);
    setCurrent(nextValid.length ? next : current);
  };

  const { black, white } = countDiscs(board);

  const restart = () => {
    setBoard(createBoard());
    setCurrent(BLACK);
    setStatus("");
    setLastMove(null);
  };

  return (
    <div className="othello-container">
      <div className="othello-title">Othello</div>
      <div className="othello-toolbar">
        <span>
          <span className="othello-disc black" /> {black}
          <span className="othello-disc white" /> {white}
        </span>
        <button className="othello-btn" onClick={restart}>
          Restart
        </button>
        <span className="othello-status">
          {status || (current === BLACK ? "Black" : "White") + "'s turn"}
        </span>
      </div>
      <div
        className="othello-board"
        style={{
          gridTemplateRows: `repeat(${SIZE}, 1fr)`,
          gridTemplateColumns: `repeat(${SIZE}, 1fr)`
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const canMove = !cell && getFlips(board, r, c, current).length;
            const last = lastMove && lastMove[0] === r && lastMove[1] === c;
            return (
              <div
                key={r + "-" + c}
                className={
                  "othello-cell" +
                  (cell === BLACK ? " black" : "") +
                  (cell === WHITE ? " white" : "") +
                  (canMove ? " valid-move" : "") +
                  (last ? " last-move" : "")
                }
                onClick={() => handleCellClick(r, c)}
                role="button"
                aria-label={
                  cell === BLACK
                    ? "Black disc"
                    : cell === WHITE
                    ? "White disc"
                    : canMove
                    ? "Valid move"
                    : "Empty"
                }
                tabIndex={0}
              >
                {cell === BLACK && <div className="othello-disc black" />}
                {cell === WHITE && <div className="othello-disc white" />}
                {!cell && canMove && <div className="othello-move-dot" />}
                {last && <div className="move-ring" />}
              </div>
            );
          })
        )}
      </div>
      <div className="othello-footer">
        Flip your opponent's discs by surrounding them.
      </div>
    </div>
  );
}