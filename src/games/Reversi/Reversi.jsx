import React, { useState } from "react";
import "./Reversi.css";

const SIZE = 8;

const EMPTY = 0,
  BLACK = 1,
  WHITE = 2;

const directionVectors = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 0],
  [0, -1],
  [0, -1],
  [-1, 1],
  [1, -1]
];

function createInitialBoard() {
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

function isOnBoard(x, y) {
  return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
}

function getOpponent(player) {
  return player === BLACK ? WHITE : BLACK;
}

function getFlips(board, row, col, player) {
  // Returns an array of [x, y] to flip if move at (row,col) is played
  if (!isOnBoard(row, col) || board[row][col] !== EMPTY) return [];
  const flips = [];
  for (let [dx, dy] of directionVectors) {
    let r = row + dx,
      c = col + dy,
      cells = [];
    while (isOnBoard(r, c) && board[r][c] === getOpponent(player)) {
      cells.push([r, c]);
      r += dx;
      c += dy;
    }
    if (
      cells.length > 0 &&
      isOnBoard(r, c) &&
      board[r][c] === player
    ) {
      flips.push(...cells);
    }
  }
  return flips;
}

function hasAnyMoves(board, player) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (getFlips(board, r, c, player).length > 0) {
        return true;
      }
    }
  }
  return false;
}

function getValidMoves(board, player) {
  let moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (getFlips(board, r, c, player).length > 0) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

function countDiscs(board) {
  let black = 0,
    white = 0;
  for (let row of board) {
    for (let cell of row) {
      if (cell === BLACK) black++;
      else if (cell === WHITE) white++;
    }
  }
  return { black, white };
}

export default function Reversi() {
  const [board, setBoard] = useState(createInitialBoard());
  const [current, setCurrent] = useState(BLACK);
  const [status, setStatus] = useState("");
  const [lastMove, setLastMove] = useState(null);

  const validMoves = getValidMoves(board, current);

  const handleCellClick = (r, c) => {
    if (status) return; // Game over
    const flips = getFlips(board, r, c, current);
    if (flips.length === 0) return; // Not a valid move

    const newBoard = cloneBoard(board);
    newBoard[r][c] = current;
    flips.forEach(([fx, fy]) => (newBoard[fx][fy] = current));

    // Check for next turn
    const next = getOpponent(current);
    let nextValidMoves = getValidMoves(newBoard, next);

    let msg = "";
    if (nextValidMoves.length === 0) {
      if (getValidMoves(newBoard, current).length === 0) {
        // Game over
        const { black, white } = countDiscs(newBoard);
        if (black > white) msg = "Black wins!";
        else if (white > black) msg = "White wins!";
        else msg = "Draw!";
      } else {
        msg =
          (current === BLACK
            ? "White"
            : "Black") + " has no moves. Turn passes.";
      }
    }
    setBoard(newBoard);
    setStatus(msg);
    setLastMove([r, c]);
    setCurrent(nextValidMoves.length === 0 ? current : next);
  };

  const { black, white } = countDiscs(board);

  function handleRestart() {
    setBoard(createInitialBoard());
    setCurrent(BLACK);
    setStatus("");
    setLastMove(null);
  }

  return (
    <div className="reversi-container">
      <div className="reversi-title">Reversi</div>
      <div className="reversi-toolbar">
        <span>
          <span className="disc black" /> {black}{" "}
          <span className="disc white" /> {white}
        </span>
        <button className="reversi-restart" onClick={handleRestart}>
          Restart
        </button>
        <span className="reversi-status">
          {status ||
            (current === BLACK
              ? "Black"
              : "White") +
              "'s turn"}
        </span>
      </div>
      <div
        className="reversi-board"
        style={{
          gridTemplateRows: `repeat(${SIZE}, 1fr)`,
          gridTemplateColumns: `repeat(${SIZE}, 1fr)`
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const flip = lastMove && lastMove[0] === r && lastMove[1] === c;
            const canMove =
              !status && getFlips(board, r, c, current).length > 0;
            return (
              <div
                key={r + "-" + c}
                className={
                  "reversi-cell" +
                  (flip ? " last-move" : "") +
                  (canMove ? " can-move" : "")
                }
                onClick={() => handleCellClick(r, c)}
              >
                {cell === BLACK && <div className="disc black" />}
                {cell === WHITE && <div className="disc white" />}
                {canMove && cell === EMPTY && <div className="move-dot" />}
              </div>
            );
          })
        )}
      </div>
      <div className="reversi-footer">
        <span>
          Classic Reversi 
        </span>
      </div>
    </div>
  );
}
