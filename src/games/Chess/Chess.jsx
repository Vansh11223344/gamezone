import React, { useState, useEffect } from "react";
import {
  GiChessKing,
  GiChessQueen,
  GiChessBishop,
  GiChessKnight,
  GiChessRook,
  GiChessPawn,
} from "react-icons/gi";
import { AlertTriangle, Lightbulb, RotateCcw, Plus } from "lucide-react";
import "./Chess.css";

// Piece icons with semantic colors
const PIECE_ICONS = {
  wK: <GiChessKing className="chess-piece-white" />,
  wQ: <GiChessQueen className="chess-piece-white" />,
  wR: <GiChessRook className="chess-piece-white" />,
  wB: <GiChessBishop className="chess-piece-white" />,
  wN: <GiChessKnight className="chess-piece-white" />,
  wP: <GiChessPawn className="chess-piece-white" />,
  bK: <GiChessKing className="chess-piece-black" />,
  bQ: <GiChessQueen className="chess-piece-black" />,
  bR: <GiChessRook className="chess-piece-black" />,
  bB: <GiChessBishop className="chess-piece-black" />,
  bN: <GiChessKnight className="chess-piece-black" />,
  bP: <GiChessPawn className="chess-piece-black" />,
};

const PIECE_INITIAL = [
  ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
  ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
  ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
];

function cloneBoard(board) {
  return board.map((r) => [...r]);
}

function getOpponent(color) {
  return color === "w" ? "b" : "w";
}

// Generate ALL legal moves for a piece at from[] for color (removes self-checks)
function generateAllMoves(board, from, color, history, skipCheck) {
  const moves = [];
  if (!from) return moves;
  const [r, c] = from;
  const piece = board[r][c];
  if (!piece || piece[0] !== color) return moves;
  const type = piece[1];

  const pushLegal = (pos) => {
    if (skipCheck) {
      moves.push(pos);
      return;
    }
    const b2 = cloneBoard(board);
    b2[pos[0]][pos[1]] = piece;
    b2[r][c] = null;
    if (!isKingAttacked(b2, color, history)) moves.push(pos);
  };

  if (type === "P") {
    const dir = color === "w" ? -1 : 1;
    if (r + dir >= 0 && r + dir <= 7 && !board[r + dir][c])
      pushLegal([r + dir, c]);
    if ((color === "w" && r === 6) || (color === "b" && r === 1))
      if (
        !board[r + dir][c] &&
        !board[r + 2 * dir][c] &&
        !board[r + dir][c]
      )
        pushLegal([r + 2 * dir, c]);
    for (const dc of [-1, 1]) {
      const nr = r + dir,
        nc = c + dc;
      if (
        nr >= 0 &&
        nr <= 7 &&
        nc >= 0 &&
        nc <= 7 &&
        board[nr][nc] &&
        board[nr][nc][0] === getOpponent(color)
      )
        pushLegal([nr, nc]);
    }
    if (history?.length) {
      const last = history[history.length - 1];
      if (last) {
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (nc < 0 || nc > 7) continue;
          const priv = board[r][nc];
          const lastMoved = last.board[r + (color === "w" ? 1 : -1)][nc];
          const isEP =
            priv &&
            priv[0] === getOpponent(color) &&
            priv[1] === "P" &&
            !board[r + dir][nc] &&
            last.turn === getOpponent(color) &&
            !last.board[r][nc] &&
            lastMoved;
          if (isEP) pushLegal([r + dir, nc]);
        }
      }
    }
    return moves;
  }
  if (type === "N") {
    for (const [dr, dc] of [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
    ]) {
      const nr = r + dr,
        nc = c + dc;
      if (
        nr >= 0 &&
        nr <= 7 &&
        nc >= 0 &&
        nc <= 7 &&
        (!board[nr][nc] || board[nr][nc][0] === getOpponent(color))
      )
        pushLegal([nr, nc]);
    }
    return moves;
  }
  const vectors = [];
  if (type === "B") vectors.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
  if (type === "R") vectors.push([1, 0], [-1, 0], [0, 1], [0, -1]);
  if (type === "Q")
    vectors.push(
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    );
  if (vectors.length) {
    for (const [dr, dc] of vectors) {
      let nr = r + dr,
        nc = c + dc;
      while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
        if (board[nr][nc]) {
          if (board[nr][nc][0] === getOpponent(color)) pushLegal([nr, nc]);
          break;
        }
        pushLegal([nr, nc]);
        nr += dr;
        nc += dc;
      }
    }
    return moves;
  }
  if (type === "K") {
    for (const dr of [-1, 0, 1])
      for (const dc of [-1, 0, 1])
        if (dr || dc) {
          const nr = r + dr,
            nc = c + dc;
          if (
            nr >= 0 &&
            nr <= 7 &&
            nc >= 0 &&
            nc <= 7 &&
            (!board[nr][nc] || board[nr][nc][0] === getOpponent(color))
          )
            pushLegal([nr, nc]);
        }
    if (!skipCheck && !isKingAttacked(board, color, history)) {
      if (
        !history.some(
          (h) => h.turn === color && h.selected && board[r][c][1] === "K"
        )
      ) {
        if (c === 4) {
          if (
            board[r][5] === null &&
            board[r][6] === null &&
            board[r][7] === color + "R" &&
            !history.some(
              (h) =>
                h.turn === color &&
                h.selected &&
                h.selected[0] === r &&
                h.selected[1] === 7
            )
          ) {
            const squares = [
              [r, 5],
              [r, 6],
            ];
            if (
              squares.every((sq) => {
                const b2 = cloneBoard(board);
                b2[sq[0]][sq[1]] = color + "K";
                b2[r][4] = null;
                return !isKingAttacked(b2, color, history);
              })
            )
              pushLegal([r, 6]);
          }
          if (
            board[r][1] === null &&
            board[r][2] === null &&
            board[r][3] === null &&
            board[r][0] === color + "R" &&
            !history.some(
              (h) =>
                h.turn === color &&
                h.selected &&
                h.selected[0] === r &&
                h.selected[1] === 0
            )
          ) {
            const squares = [
              [r, 3],
              [r, 2],
            ];
            if (
              squares.every((sq) => {
                const b2 = cloneBoard(board);
                b2[sq[0]][sq[1]] = color + "K";
                b2[r][4] = null;
                return !isKingAttacked(b2, color, history);
              })
            )
              pushLegal([r, 2]);
          }
        }
      }
    }
    return moves;
  }
  return moves;
}

// Is the king of color under attack?
function isKingAttacked(board, color, history) {
  let kingPos = null;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === color + "K") kingPos = [r, c];
    }
  if (!kingPos) return true;
  let occ = getOpponent(color);
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c][0] === occ) {
        const ms = generateAllMoves(board, [r, c], occ, history, true);
        if (ms.some(([rr, cc]) => rr === kingPos[0] && cc === kingPos[1]))
          return true;
      }
    }
  return false;
}

// Stalemate/3-fold
function gameDrawn(board, history) {
  if (history.length > 8) {
    let reps = {};
    for (const h of history) {
      const hash = JSON.stringify(h.board);
      reps[hash] = (reps[hash] || 0) + 1;
      if (reps[hash] >= 3) return true;
    }
  }
  return false;
}

const ALL_WHITE_PIECES = ["wQ", "wR", "wB", "wN", "wP"];
const ALL_BLACK_PIECES = ["bQ", "bR", "bB", "bN", "bP"];
const INITIAL_PIECES_COUNT = {
  wQ: 1,
  wR: 2,
  wB: 2,
  wN: 2,
  wP: 8,
  bQ: 1,
  bR: 2,
  bB: 2,
  bN: 2,
  bP: 8,
};

function getBoardPieceCount(board) {
  const count = {
    wQ: 0,
    wR: 0,
    wB: 0,
    wN: 0,
    wP: 0,
    bQ: 0,
    bR: 0,
    bB: 0,
    bN: 0,
    bP: 0,
  };
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (count[p] !== undefined) count[p]++;
    }
  return count;
}

// Piece values for evaluation
const PIECE_VALUES = {
  P: 1,
  N: 3,
  B: 3,
  R: 5,
  Q: 9,
  K: 0,
};

// Evaluate a move's value
function evaluateMove(board, from, to, color, history) {
  const [fr, fc] = from;
  const [tr, tc] = to;
  const piece = board[fr][fc];
  let score = 0;

  const nextBoard = cloneBoard(board);
  nextBoard[tr][tc] = piece;
  nextBoard[fr][fc] = null;

  if (piece[1] === "P" && fc !== tc && !board[tr][tc]) {
    nextBoard[fr][tc] = null;
  }

  if (piece[1] === "K" && Math.abs(fc - tc) === 2) {
    if (tc === 6) {
      nextBoard[tr][5] = nextBoard[tr][7];
      nextBoard[tr][7] = null;
    } else if (tc === 2) {
      nextBoard[tr][3] = nextBoard[tr][0];
      nextBoard[tr][0] = null;
    }
  }

  const opponent = getOpponent(color);
  let hasOpponentMoves = false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (nextBoard[r][c] && nextBoard[r][c][0] === opponent) {
        if (generateAllMoves(nextBoard, [r, c], opponent, history).length > 0) {
          hasOpponentMoves = true;
          break;
        }
      }
    }
    if (hasOpponentMoves) break;
  }
  if (!hasOpponentMoves && isKingAttacked(nextBoard, opponent, history)) {
    return 10000;
  }

  if (isKingAttacked(nextBoard, opponent, history)) {
    score += 5;
  }

  const captured = board[tr][tc];
  if (captured && captured[0] === opponent) {
    score += PIECE_VALUES[captured[1]];
  }

  if (piece[1] === "P" && (tr === 0 || tr === 7)) {
    score += PIECE_VALUES["Q"];
  }

  score += Math.random() * 0.1;

  return score;
}

// Get best moves for hints
function getBestMoves(board, color, history, count = 3) {
  const allMoves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c][0] === color) {
        const moves = generateAllMoves(board, [r, c], color, history).map(
          (dest) => ({
            from: [r, c],
            to: dest,
            score: evaluateMove(board, [r, c], dest, color, history),
          })
        );
        allMoves.push(...moves);
      }
    }
  }

  if (allMoves.length === 0) return [];

  allMoves.sort((a, b) => b.score - a.score);
  return allMoves.slice(0, count);
}

// Main Chess Component
function Chess() {
  const [board, setBoard] = useState(cloneBoard(PIECE_INITIAL));
  const [turn, setTurn] = useState("w");
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState([]);
  const [mode, setMode] = useState(null);
  const [history, setHistory] = useState([]);
  const [promotion, setPromotion] = useState(null);
  const [result, setResult] = useState(null);
  const [lastWinner, setLastWinner] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [hints, setHints] = useState([]);

  // Compute legal moves for selected piece
  const getLegalMoves = (from) => {
    return generateAllMoves(board, from, turn, history);
  };

  // Handle cell click
  const handleCellClick = (r, c) => {
    if (result) return;
    const piece = board[r][c];
    if (promotion) return;

    if (selected && moves.some(([mr, mc]) => mr === r && mc === c)) {
      doMove(selected, [r, c]);
    } else if (piece && piece[0] === turn) {
      setSelected([r, c]);
      setMoves(getLegalMoves([r, c]));
    } else {
      setSelected(null);
      setMoves([]);
    }
  };

  // Show hints
  const toggleHints = () => {
    if (!showHints) {
      const bestMoves = getBestMoves(board, turn, history);
      setHints(bestMoves);
      if (bestMoves.length > 0) {
        alert(`💡 Best Moves Found: Found ${bestMoves.length} good moves for ${turn === 'w' ? 'White' : 'Black'}`);
      }
    }
    setShowHints(!showHints);
  };

  // Moves and special pawn promotion/castling/en passant logic
  const doMove = (from, to) => {
    let [fr, fc] = from;
    let [tr, tc] = to;
    let moving = board[fr][fc];
    let next = cloneBoard(board);

    // Pawn promotion
    if (
      moving[1] === "P" &&
      ((moving[0] === "w" && tr === 0) || (moving[0] === "b" && tr === 7))
    ) {
      setPromotion({ from, to });
      return;
    }

    // Castling move
    if (moving[1] === "K" && Math.abs(fc - tc) === 2) {
      if (tc === 6) {
        next[tr][5] = next[tr][7];
        next[tr][7] = null;
      } else if (tc === 2) {
        next[tr][3] = next[tr][0];
        next[tr][0] = null;
      }
    }

    // En passant
    if (moving[1] === "P" && fc !== tc && !board[tr][tc]) {
      next[fr][tc] = null;
    }

    setHistory([
      ...history,
      { board: cloneBoard(board), turn, selected, moves },
    ]);
    next[tr][tc] = moving;
    next[fr][fc] = null;
    setBoard(next);
    setSelected(null);
    setMoves([]);
    setShowHints(false);
    setHints([]);
    setTurn(getOpponent(turn));
  };

  // Pawn promote to
  const promotePawn = (pieceName) => {
    const { from, to } = promotion;
    let next = cloneBoard(board);
    next[to[0]][to[1]] = turn + pieceName;
    next[from[0]][from[1]] = null;
    setHistory([
      ...history,
      { board: cloneBoard(board), turn, selected, moves },
    ]);
    setBoard(next);
    setPromotion(null);
    setSelected(null);
    setMoves([]);
    setTurn(getOpponent(turn));
  };

  // Undo last move
  const undo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setBoard(cloneBoard(last.board));
    setTurn(last.turn);
    setSelected(last.selected);
    setMoves(last.moves);
    setHistory(history.slice(0, history.length - 1));
    setResult(null);
    setPromotion(null);
    setLastWinner(null);
    setShowHints(false);
    setHints([]);
  };

  // Promotion UI
  const PromotionModal = () => (
    <div className="chess-promotion-modal">
      <div className="chess-promotion-content">
        <h3 className="chess-promotion-title">Choose Promotion</h3>
        <div className="chess-promotion-buttons">
          {["Q", "R", "B", "N"].map((k) => (
            <button
              key={k}
              className="chess-promotion-btn"
              onClick={() => promotePawn(k)}
            >
              {PIECE_ICONS[turn + k]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Reset/new game
  const startNew = (newMode) => {
    setBoard(cloneBoard(PIECE_INITIAL));
    setTurn("w");
    setSelected(null);
    setMoves([]);
    setHistory([]);
    setPromotion(null);
    setResult(null);
    setMode(newMode);
    setLastWinner(null);
    setShowHints(false);
    setHints([]);
  };

  // Check warnings and game state
  useEffect(() => {
    if (!mode || promotion || result) return;

    let hasLegal = false;
    outer: for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (
          board[r][c] &&
          board[r][c][0] === turn &&
          generateAllMoves(board, [r, c], turn, history).length > 0
        ) {
          hasLegal = true;
          break outer;
        }

    let inCheck = isKingAttacked(board, turn, history);

    if (inCheck && hasLegal) {
      alert(`⚠️ Check! ${turn === "w" ? "White" : "Black"} king is in check!`);
    }

    if (!hasLegal) {
      if (inCheck) {
        setResult(`Checkmate! ${turn === "w" ? "Black" : "White"} wins!`);
        setLastWinner(turn === "w" ? "b" : "w");
        alert(`🏆 Checkmate! ${turn === "w" ? "Black" : "White"} wins the game!`);
      } else {
        setResult("Stalemate - It's a draw!");
        setLastWinner(null);
        alert("🤝 Stalemate: The game ends in a draw!");
      }
    } else if (gameDrawn(board, history)) {
      setResult("Draw by repetition!");
      setLastWinner(null);
      alert("🤝 Draw: Game drawn by threefold repetition!");
    }
  }, [board, turn, promotion, mode, history, result]);

  // Computer move logic
  useEffect(() => {
    if (mode === "cpu" && turn === "b" && !result && !promotion) {
      setTimeout(() => {
        const allMoves = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (board[r][c] && board[r][c][0] === "b") {
              const moves = generateAllMoves(board, [r, c], "b", history).map(
                (dest) => ({
                  from: [r, c],
                  to: dest,
                  score: evaluateMove(board, [r, c], dest, "b", history),
                })
              );
              allMoves.push(...moves);
            }
          }
        }
        if (allMoves.length === 0) return;

        allMoves.sort((a, b) => b.score - a.score);
        const topMoves = allMoves.slice(0, Math.min(3, allMoves.length));
        const move = topMoves[Math.floor(Math.random() * topMoves.length)];

        if (
          board[move.from[0]][move.from[1]][1] === "P" &&
          move.to[0] === 7
        ) {
          doMove(move.from, move.to);
          setTimeout(() => promotePawn("Q"), 100);
        } else {
          doMove(move.from, move.to);
        }
      }, 750);
    }
  }, [board, turn, mode, result, promotion, history]);

  // Captured pieces logic
  const boardPieceCount = getBoardPieceCount(board);

  const blackCaptured = {};
  for (const k of ALL_BLACK_PIECES) {
    blackCaptured[k] = INITIAL_PIECES_COUNT[k] - boardPieceCount[k];
    if (blackCaptured[k] < 0) blackCaptured[k] = 0;
  }

  const whiteCaptured = {};
  for (const k of ALL_WHITE_PIECES) {
    whiteCaptured[k] = INITIAL_PIECES_COUNT[k] - boardPieceCount[k];
    if (whiteCaptured[k] < 0) whiteCaptured[k] = 0;
  }

  // Render captured row
  const renderCapturedRow = (captured, label) => (
    <div className="chess-captured-row">
      <span className="chess-captured-label">{label}:</span>
      <div className="chess-captured-pieces">
        {Object.entries(captured)
          .filter(([, v]) => v > 0)
          .map(([p, v]) => (
            <span className="chess-captured-piece" key={p}>
              {PIECE_ICONS[p]}
              {v > 1 && <span className="chess-captured-count">{v}</span>}
            </span>
          ))}
        {Object.values(captured).every((v) => v === 0) && (
          <span className="chess-captured-none">None</span>
        )}
      </div>
    </div>
  );

  // Render a single cell
  const renderCell = (piece, r, c) => {
    const isDark = (r + c) % 2 !== 0;
    const isSel = selected && selected[0] === r && selected[1] === c;
    const canMove = moves.some(([mr, mc]) => mr === r && mc === c);
    const isCapture = canMove && board[r][c];
    const inCheck = piece && piece[1] === "K" && isKingAttacked(board, piece[0], history);
    const isHintMove = showHints && hints.some(hint =>
      hint.from[0] === r && hint.from[1] === c
    );
    const isHintTarget = showHints && hints.some(hint =>
      hint.to[0] === r && hint.to[1] === c
    );

    return (
      <div
        key={r + "-" + c}
        className={`chess-cell ${isDark ? 'chess-cell-dark' : 'chess-cell-light'} 
          ${isSel ? 'chess-cell-selected' : ''} 
          ${canMove ? 'chess-cell-move' : ''} 
          ${isCapture ? 'chess-cell-capture' : ''}
          ${inCheck ? 'chess-cell-check' : ''}
          ${isHintMove ? 'chess-cell-hint-from' : ''}
          ${isHintTarget ? 'chess-cell-hint-to' : ''}`}
        onClick={() => handleCellClick(r, c)}
      >
        {piece && (
          <div className="chess-piece">
            {PIECE_ICONS[piece]}
          </div>
        )}
        {canMove && !board[r][c] && <div className="chess-move-dot" />}
        {isCapture && <div className="chess-capture-indicator" />}
      </div>
    );
  };

  // Mode selection UI
  if (!mode)
    return (
      <div className="chess-game-container">
        <div className="chess-mode-selection">
          <h1 className="chess-title">Chess Master</h1>
          <p className="chess-subtitle">Choose your game mode</p>
          <div className="chess-mode-buttons">
            <button
              className="chess-mode-btn chess-mode-btn-primary"
              onClick={() => startNew("2p")}
            >
              <div className="chess-mode-btn-content">
                <span className="chess-mode-icon">👥</span>
                Two Players
              </div>
              <span className="chess-mode-subtext">Play with a friend</span>
            </button>
            <button
              className="chess-mode-btn chess-mode-btn-secondary"
              onClick={() => startNew("cpu")}
            >
              <div className="chess-mode-btn-content">
                <span className="chess-mode-icon">🤖</span>
                vs Computer
              </div>
              <span className="chess-mode-subtext">Challenge the AI</span>
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="chess-game-container">
      <div className="chess-game">
        {/* Captured pieces */}
        <div className="chess-captured-section">
          {renderCapturedRow(whiteCaptured, "Captured by Black")}
          {renderCapturedRow(blackCaptured, "Captured by White")}
        </div>

        {/* Game header */}
        <div className="chess-header">
          <div className="chess-status">
            {result ? (
              <div className="chess-result">
                <AlertTriangle className="chess-icon" />
                {result}
              </div>
            ) : (
              <div className="chess-turn">
                <div className={`chess-turn-indicator ${turn === 'w' ? 'chess-turn-white' : 'chess-turn-black'}`} />
                {turn === "w" ? "White" : "Black"} to move
                {isKingAttacked(board, turn, history) && (
                  <span className="chess-check-indicator">
                    <AlertTriangle className="chess-icon" />
                    Check!
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="chess-controls">
            <button
              className="chess-btn chess-btn-secondary"
              onClick={toggleHints}
              disabled={result || (turn === "b" && mode === "cpu")}
            >
              <Lightbulb className="chess-icon" />
              {showHints ? "Hide" : "Hints"}
            </button>
            <button
              className="chess-btn chess-btn-outline"
              onClick={undo}
              disabled={!history.length}
            >
              <RotateCcw className="chess-icon" />
              Undo
            </button>
            <button
              className="chess-btn chess-btn-primary"
              onClick={() => startNew(mode)}
            >
              <Plus className="chess-icon" />
              New Game
            </button>
          </div>
        </div>

        {/* Chess board */}
        <div className="chess-board-container">
          <div className="chess-board">
            {board.map((row, r) =>
              row.map((cell, c) => renderCell(cell, r, c))
            )}
          </div>
          {promotion && <PromotionModal />}
        </div>

        {/* Game info */}
        <div className="chess-footer">
          <div className="chess-info">
            <p className="chess-info-text">
              Click pieces to select them, then click highlighted squares to move.
            </p>
            {mode === "cpu" && (
              <p className="chess-info-text">
                You are playing as White against the computer.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chess;