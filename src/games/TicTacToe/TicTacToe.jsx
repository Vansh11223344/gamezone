import React, { useState, useEffect } from "react";
import "./TicTacToe.css";

// Helper to check winner
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c])
      return squares[a];
  }
  return null;
}

// Minimax algorithm for optimal AI move
function minimax(board, isMax, depth = 0) {
  const winner = calculateWinner(board);
  if (winner === "O") return { score: 10 - depth };
  if (winner === "X") return { score: -10 + depth };
  if (!board.includes(null)) return { score: 0 };

  const scores = [];
  const moves = [];

  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      const newBoard = [...board];
      newBoard[i] = isMax ? "O" : "X";
      const result = minimax(newBoard, !isMax, depth + 1);
      scores.push(result.score);
      moves.push(i);
    }
  }

  if (isMax) {
    const maxScoreIndex = scores.indexOf(Math.max(...scores));
    return { score: scores[maxScoreIndex], move: moves[maxScoreIndex] };
  } else {
    const minScoreIndex = scores.indexOf(Math.min(...scores));
    return { score: scores[minScoreIndex], move: moves[minScoreIndex] };
  }
}

// AI Move: pick random empty (for easy mode)
function randomAIMove(board) {
  const empties = board
    .map((v, i) => (v == null ? i : null))
    .filter((v) => v != null);
  if (empties.length === 0) return board;
  const choice = empties[Math.floor(Math.random() * empties.length)];
  const newBoard = [...board];
  newBoard[choice] = "O";
  return newBoard;
}

const TicTacToe = () => {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [player, setPlayer] = useState("X");
  const [mode, setMode] = useState(null); // null, "human", "ai"
  const [aiTurn, setAiTurn] = useState(false);

  const winner = calculateWinner(squares);

  useEffect(() => {
    if (mode === "ai" && player === "O" && !winner) {
      setTimeout(() => {
        // 10% chance for easy (random) move
        const isEasyGame = Math.random() < 0.1;
        let newBoard;
        if (isEasyGame) {
          newBoard = randomAIMove(squares);
        } else {
          // Use minimax for optimal move
          const { move } = minimax(squares, true);
          newBoard = [...squares];
          newBoard[move] = "O";
        }
        setSquares(newBoard);
        setPlayer("X");
      }, 600);
    }
  }, [player, mode, winner, squares]);

  function handleClick(i) {
    if (squares[i] || winner || (mode === "ai" && player === "O")) return;
    const next = squares.slice();
    next[i] = player;
    setSquares(next);
    setPlayer((p) => (p === "X" ? "O" : "X"));
  }

  if (mode === null) {
    return (
      <div className="ttt-modal">
        <div className="ttt-mode-section">
          <h2>Tic-Tac-Toe</h2>
          <button onClick={() => setMode("human")}>2 Players</button>
          <button onClick={() => setMode("ai")}>1 vs Computer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ttt-root">
      <div className="ttt-section">
        <h2 className="ttt-title">Tic-Tac-Toe</h2>
        <div className="ttt-board">
          {squares.map((sq, i) => (
            <button key={i} className="ttt-square" onClick={() => handleClick(i)}>
              {sq}
            </button>
          ))}
        </div>
        <div className="ttt-info">
          {winner ? (
            <span className="ttt-winner">{winner} wins!</span>
          ) : (
            <span className="ttt-turn">Turn: {player}</span>
          )}
        </div>
        <button
          className="ttt-reset"
          onClick={() => {
            setSquares(Array(9).fill(null));
            setPlayer("X");
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default TicTacToe;