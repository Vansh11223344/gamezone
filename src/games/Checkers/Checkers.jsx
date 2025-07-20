import React, { useState } from "react";
import "./Checkers.css";

const BOARD_SIZE = 8;

function getInitialBoard() {
  const board = Array(BOARD_SIZE)
    .fill()
    .map(() => Array(BOARD_SIZE).fill(0));
  // Black pieces
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if ((r + c) % 2 === 1) board[r][c] = 2;
  // Red pieces
  for (let r = BOARD_SIZE - 3; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if ((r + c) % 2 === 1) board[r][c] = 1;
  return board;
}
const KING_ROW = { 1: 0, 2: BOARD_SIZE - 1 };

export default function Checkers() {
  // Main game state
  const [board, setBoard] = useState(getInitialBoard());
  const [kings, setKings] = useState(
    Array(BOARD_SIZE)
      .fill()
      .map(() => Array(BOARD_SIZE).fill(false))
  );
  const [turn, setTurn] = useState(1);
  const [selected, setSelected] = useState(null); // {row,col}
  const [moves, setMoves] = useState([]); // {to:[r,c], capture:[r,c]|null}
  const [winner, setWinner] = useState(null);

  // Win/loss state: 'win' is number of pieces captured by this color, 'loss' is number lost
  const [stats, setStats] = useState({
    red: { win: 0, loss: 0 },
    black: { win: 0, loss: 0 },
    games: { red: 0, black: 0 },
  });

  function resetGame(updateGameStats = false) {
    setBoard(getInitialBoard());
    setKings(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(false)));
    setTurn(1);
    setSelected(null);
    setMoves([]);
    if (updateGameStats && winner) {
      setStats(prev => {
        let games = { ...prev.games };
        if (winner === 1) games.red++;
        else if (winner === 2) games.black++;
        return { ...prev, games };
      });
    }
    setWinner(null);
  }

  function getDirections(piece, isKing) {
    if (isKing) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    return piece === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
  }

  function inBounds(r, c) {
    return r >= 0 && c >= 0 && r < BOARD_SIZE && c < BOARD_SIZE;
  }

  function validMoves(row, col, jumpOnly = false, b = board, k = kings) {
    if (!inBounds(row, col) || b[row][col] === 0) return [];
    const isKing = k[row][col];
    const piece = b[row][col];
    let result = [];
    for (const [dr, dc] of getDirections(piece, isKing)) {
      const nr = row + dr, nc = col + dc;
      const jr = row + dr * 2, jc = col + dc * 2;
      // Simple move
      if (!jumpOnly && inBounds(nr, nc) && b[nr][nc] === 0) {
        result.push({ to: [nr, nc], capture: null });
      }
      // Jump
      if (
        inBounds(jr, jc) &&
        b[nr][nc] !== 0 &&
        b[nr][nc] !== piece &&
        b[jr][jc] === 0
      ) {
        result.push({ to: [jr, jc], capture: [nr, nc] });
      }
    }
    return result;
  }

  function anyCaptureMoves(player) {
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (
          board[r][c] === player &&
          validMoves(r, c, true).length > 0
        )
          return true;
    return false;
  }

  function handleCellClick(r, c) {
    if (winner) return;
    if (!selected) {
      if (board[r][c] === turn) {
        const mustJump = anyCaptureMoves(turn);
        const nextMoves = validMoves(r, c, mustJump);
        if (nextMoves.length > 0) {
          setSelected({ row: r, col: c });
          setMoves(nextMoves);
        }
      }
    } else {
      // Is this a valid move?
      const m = moves.find((m) => m.to[0] === r && m.to[1] === c);
      if (m) {
        commitMove(selected.row, selected.col, r, c, m.capture);
      } else {
        setSelected(null); setMoves([]);
      }
    }
  }

  function commitMove(sr, sc, dr, dc, capture) {
    let newBoard = board.map(row => [...row]);
    let newKings = kings.map(row => [...row]);
    newBoard[dr][dc] = newBoard[sr][sc];
    newBoard[sr][sc] = 0;
    newKings[dr][dc] = newKings[sr][sc];
    newKings[sr][sc] = false;
    // Update counters if a piece was captured
    if (capture) {
      const capturedPiece = newBoard[capture[0]][capture[1]];
      newBoard[capture[0]][capture[1]] = 0;
      newKings[capture[0]][capture[1]] = false;
      setStats(prev => {
        let red = { ...prev.red }, black = { ...prev.black };
        if (capturedPiece === 1) {
          red.loss++;
          black.win++;
        }
        if (capturedPiece === 2) {
          black.loss++;
          red.win++;
        }
        return { ...prev, red, black };
      });
    }
    // King if needed
    if (!newKings[dr][dc] && dr === KING_ROW[newBoard[dr][dc]]) {
      newKings[dr][dc] = true;
    }
    // Another jump?
    if (capture) {
      const moreJumps = validMoves(dr, dc, true, newBoard, newKings)
        .filter(m => m.capture);
      if (moreJumps.length) {
        setBoard(newBoard); setKings(newKings);
        setSelected({ row: dr, col: dc });
        setMoves(moreJumps);
        return;
      }
    }
    // Switch player
    const nextPlayer = turn === 1 ? 2 : 1;
    // Winner check
    const oppHasMove = (() => {
      for (let r = 0; r < BOARD_SIZE; r++)
        for (let c = 0; c < BOARD_SIZE; c++)
          if (
            newBoard[r][c] === nextPlayer &&
            validMoves(r, c, false, newBoard, newKings).length > 0
          ) return true;
      return false;
    })();
    setBoard(newBoard); setKings(newKings);
    setSelected(null); setMoves([]);
    if (oppHasMove)
      setTurn(nextPlayer);
    else
      setWinner(turn); // current player wins!
  }

  // On win, update games stats only
  function handleResetClick() {
    resetGame(true);
  }
  function handleStatsReset() {
    setStats({
      red: { win: 0, loss: 0 },
      black: { win: 0, loss: 0 },
      games: { red: 0, black: 0 }
    });
  }

  return (
    <div className="checkers-app">
      <div className="checkers-header">
        <span role="img" aria-label="checker" className="logo">⬤</span>
        Classic Checkers
      </div>
      <div className="checkers-board">
        {board.map((row, r) =>
          <div className="row" key={r}>
            {row.map((cell, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selected && selected.row === r && selected.col === c;
              const isMove = moves.some(m => m.to[0] === r && m.to[1] === c);
              return (
                <div
                  className={
                    "cell" +
                    (isDark ? " dark" : " light") +
                    (isSelected ? " selected" : "") +
                    (isMove ? " move" : "")
                  }
                  key={c}
                  onClick={() => (isDark || board[r][c]) && handleCellClick(r, c)}
                  tabIndex={isDark ? 0 : -1}
                >
                  {cell !== 0 && (
                    <div
                      className={`piece piece${cell}` + (kings[r][c] ? " king" : "")}
                    >
                      {kings[r][c] && <span className="crown">♛</span>}
                    </div>
                  )}
                  {isMove && <div className="move-dot"></div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="checkers-panel">
        {winner 
          ? <span className={`piece${winner}`}>Winner: {winner===1?"Red":"Black"}!</span>
          : <span>
              Turn: <span className={`piece${turn}`}>{turn===1?"Red":"Black"}</span>
            </span>
        }
        <button className="reset-btn" onClick={winner ? handleResetClick : resetGame}>
          {winner ? "New Game" : "Reset"}
        </button>
      </div>
      <div className="checkers-stats-wrap">
        <div className="checkers-stats">
          <div>
            <span className="piece1 stats-piece"></span>
            Red Wins (captures): <b>{stats.red.win}</b>
            &nbsp;|&nbsp; Losses: <b>{stats.red.loss}</b>
            <br />
            Game Wins: <b>{stats.games.red}</b>
          </div>
          <div>
            <span className="piece2 stats-piece"></span>
            Black Wins (captures): <b>{stats.black.win}</b>
            &nbsp;|&nbsp; Losses: <b>{stats.black.loss}</b>
            <br />
            Game Wins: <b>{stats.games.black}</b>
          </div>
        </div>
        <button className="stats-reset" onClick={handleStatsReset}>
          Reset Stats
        </button>
      </div>
    </div>
  );
}
