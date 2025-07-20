import React, { useState, useEffect } from "react";
import "./Chess.css";
import {
  GiChessKing,
  GiChessQueen,
  GiChessBishop,
  GiChessKnight,
  GiChessRook,
  GiChessPawn,
} from "react-icons/gi";

// Piece icons, classic black and white
const PIECE_ICONS = {
  wK: <GiChessKing style={{ color: "#fff" }} />,
  wQ: <GiChessQueen style={{ color: "#fff" }} />,
  wR: <GiChessRook style={{ color: "#fff" }} />,
  wB: <GiChessBishop style={{ color: "#fff" }} />,
  wN: <GiChessKnight style={{ color: "#fff" }} />,
  wP: <GiChessPawn style={{ color: "#fff" }} />,
  bK: <GiChessKing style={{ color: "#181818" }} />,
  bQ: <GiChessQueen style={{ color: "#181818" }} />,
  bR: <GiChessRook style={{ color: "#181818" }} />,
  bB: <GiChessBishop style={{ color: "#181818" }} />,
  bN: <GiChessKnight style={{ color: "#181818" }} />,
  bP: <GiChessPawn style={{ color: "#181818" }} />,
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
    // Forward move
    if (r + dir >= 0 && r + dir <= 7 && !board[r + dir][c])
      pushLegal([r + dir, c]);
    // Double forward from home
    if ((color === "w" && r === 6) || (color === "b" && r === 1))
      if (
        !board[r + dir][c] &&
        !board[r + 2 * dir][c] &&
        !board[r + dir][c]
      )
        pushLegal([r + 2 * dir, c]);
    // Captures
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
    // En passant
    if (history?.length) {
      const last = history[history.length - 1];
      if (last) {
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (nc < 0 || nc > 7) continue;
          const priv = board[r][nc];
          const lastMoved =
            last.board[r + (color === "w" ? 1 : -1)][nc];
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
    // Castling
    if (!skipCheck && !isKingAttacked(board, color, history)) {
      if (
        !history.some(
          (h) =>
            h.turn === color && h.selected && board[r][c][1] === "K"
        )
      ) {
        // Kingside
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
          // Queenside
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
        const ms = generateAllMoves(
          board,
          [r, c],
          occ,
          history,
          true
        );
        if (
          ms.some(([rr, cc]) => rr === kingPos[0] && cc === kingPos[1])
        )
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
  // Knights, Bishops, Rooks & Queen, no white King, since that's never captured
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

// Main Chess Component:
function Chess() {
  const [board, setBoard] = useState(cloneBoard(PIECE_INITIAL));
  const [turn, setTurn] = useState("w");
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState([]);
  const [mode, setMode] = useState(null); // null, "2p", "cpu"
  const [history, setHistory] = useState([]);
  const [promotion, setPromotion] = useState(null);
  const [result, setResult] = useState(null);
  const [lastWinner, setLastWinner] = useState(null);

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

  // Moves and special pawn promotion/castling/en passant logic
  const doMove = (from, to) => {
    let [fr, fc] = from;
    let [tr, tc] = to;
    let moving = board[fr][fc];
    let next = cloneBoard(board);
    // Pawn promotion
    if (
      moving[1] === "P" &&
      ((moving[0] === "w" && tr === 0) ||
        (moving[0] === "b" && tr === 7))
    ) {
      setPromotion({ from, to });
      return;
    }
    // Castling move
    if (moving[1] === "K" && Math.abs(fc - tc) === 2) {
      // Move rook for castling
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
      next[fr][tc] = null; // Capture behind
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
  };

  // Promotion UI
  const PromotionModal = () => (
    <div className="chess-promo-modal">
      <div>Choose Promotion:</div>
      {["Q", "R", "B", "N"].map((k) => (
        <button
          key={k}
          className="chess-promo-btn"
          onClick={() => promotePawn(k)}
        >
          {PIECE_ICONS[turn + k]}
        </button>
      ))}
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
  };

  // Checkmate/stalemate/draw
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

    // Show "by White/Black" and more expressive messages
    if (!hasLegal) {
      if (inCheck) {
        // Previous move delivered checkmate
        setResult(
          `Checkmate by ${turn === "w" ? "Black" : "White"}!`
        );
        setLastWinner(turn === "w" ? "b" : "w");
      } else {
        setResult(
          `Stalemate by ${turn === "w" ? "Black" : "White"}!`
        );
        setLastWinner(turn === "w" ? "b" : "w");
      }
    } else if (gameDrawn(board, history)) {
      setResult("Draw: 3-fold repetition or stalemate!");
      setLastWinner(null);
    }
  }, [board, turn, promotion, mode, history, result]);

  // Computer move logic (random for black)
  useEffect(() => {
    if (mode === "cpu" && turn === "b" && !result && !promotion) {
      setTimeout(() => {
        const allMoves = [];
        for (let r = 0; r < 8; r++)
          for (let c = 0; c < 8; c++) {
            if (board[r][c] && board[r][c][0] === "b") {
              let ms = generateAllMoves(
                board,
                [r, c],
                "b",
                history
              ).map((dest) => [
                [r, c],
                dest,
              ]);
              allMoves.push(...ms);
            }
          }
        if (allMoves.length === 0) return;
        const move =
          allMoves[Math.floor(Math.random() * allMoves.length)];
        doMove(...move);
      }, 550);
    }
    // eslint-disable-next-line
  }, [board, turn, mode, result, promotion, history]);

  // --- CAPTURED PIECES CODE ---

  // Compute what pieces are out by each player
  const boardPieceCount = getBoardPieceCount(board);

  // For white: which of black's pieces are captured?
  const blackCaptured = {};
  for (const k of ALL_BLACK_PIECES) {
    // No king, so k is from [bQ, bR, bN, bB, bP]
    blackCaptured[k] = INITIAL_PIECES_COUNT[k] - boardPieceCount[k];
    if (blackCaptured[k] < 0) blackCaptured[k] = 0;
  }
  // For black: which of white's pieces are captured?
  const whiteCaptured = {};
  for (const k of ALL_WHITE_PIECES) {
    whiteCaptured[k] = INITIAL_PIECES_COUNT[k] - boardPieceCount[k];
    if (whiteCaptured[k] < 0) whiteCaptured[k] = 0;
  }

  // Render captured row
  const renderCapturedRow = (captured, label) => (
    <div className="chess-captured-row">
      <span className="captured-label">
        Out by {label}:
      </span>
      {Object.entries(captured)
        .filter(([, v]) => v > 0)
        .map(([p, v]) => (
          <span className="chess-captured-piece" key={p}>
            {PIECE_ICONS[p]}
            {v > 1 && <span className="chess-captured-count">{v}</span>}
          </span>
        ))}
      {Object.values(captured).every((v) => v === 0) && (
        <span className="chess-captured-piece none">-</span>
      )}
    </div>
  );

  // Render a single cell
  const renderCell = (piece, r, c) => {
    const isDark = (r + c) % 2 !== 0;
    const isSel = selected && selected[0] === r && selected[1] === c;
    const canMove = moves.some(([mr, mc]) => mr === r && mc === c);
    const inCheck =
      piece && piece[1] === "K" && isKingAttacked(board, piece[0], history);

    return (
      <div
        key={r + "-" + c}
        className={
          "chess-cell" +
          (isDark ? " chess-dark" : " chess-light") +
          (isSel ? " chess-sel" : "") +
          (canMove ? " chess-move" : "") +
          (inCheck ? " chess-check" : "")
        }
        onClick={() => handleCellClick(r, c)}
        tabIndex={0}
      >
        {piece && <span className={"chess-piece " + piece}>{PIECE_ICONS[piece]}</span>}
        {canMove && !board[r][c] && <span className="chess-move-dot"></span>}
      </div>
    );
  };

  // UI Mode select
  if (!mode)
  return (
    <div className="chess-mode-modal">
      <div className="chess-mode-section">
        <h2>Chess</h2>
        <button className="chess-btn" onClick={() => startNew("2p")}>
          2 Players
        </button>
        <button className="chess-btn" onClick={() => startNew("cpu")}>
          1 vs Computer
        </button>
      </div>
    </div>
  );


  return (
    <div className="chess-outer">
      {/** CAPTURED PIECES ROWS */}
      <div className="chess-captured-wrap">
        {renderCapturedRow(whiteCaptured, "Black")}
        {renderCapturedRow(blackCaptured, "White")}
      </div>

      <div className="chess-header">
        <span className="chess-player">
          {result
            ? "Game Over:"
            : turn === "w"
            ? "White turn"
            : "Black turn"}
        </span>
        <button className="chess-btn" onClick={() => startNew(mode)}>
          New
        </button>
        <button className="chess-btn" onClick={undo} disabled={!history.length}>
          Undo
        </button>
        {result && (
          <span className="chess-result">{result}</span>
        )}
      </div>
      <div className="chess-board-wrap">
        <div className="chess-board">
          {board.map((row, r) => row.map((cell, c) => renderCell(cell, r, c)))}
        </div>
        {promotion && <PromotionModal />}
      </div>
      <div className="chess-footer">
        <ul>
          <li>
            Strategy begins with a single tap — choose your piece, chart its path.
          </li>
          <li>
            Every sacred law of chess lives here: the quiet pawn, the sudden queen.
          </li>
          <li>All The Best !!!</li>
        </ul>
      </div>
    </div>
  );
}

export default Chess;
