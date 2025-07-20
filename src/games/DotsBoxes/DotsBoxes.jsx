import React, { useState, useEffect } from "react";
import "./DotsBoxes.css";

// Board size
const BOARD_ROWS = 6;
const BOARD_COLS = 6;

// Helper to build starting state
function createInitialState(rows, cols) {
  const horiz = Array(rows + 1)
    .fill(0)
    .map(() => Array(cols).fill(false));
  const vert = Array(rows)
    .fill(0)
    .map(() => Array(cols + 1).fill(false));
  const owner = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(null));
  return { horiz, vert, owner };
}

export default function DotsAndBoxes() {
  const [mode, setMode] = useState(null); // null, '2p', 'cpu'
  const [state, setState] = useState(() =>
    createInitialState(BOARD_ROWS, BOARD_COLS)
  );
  const [turn, setTurn] = useState(0); // 0 = Red (human), 1 = Blue (human or computer)
  const [score, setScore] = useState([0, 0]);
  const [gameOver, setGameOver] = useState(false);

  // Handle computer move! If mode==='cpu' and turn===1 (Computer), act after some delay.
  useEffect(() => {
    if (mode === "cpu" && turn === 1 && !gameOver) {
      const timer = setTimeout(() => {
        const choices = getAvailableLines(state);
        if (choices.length === 0) return;
        // Default "AI": random move, or lowest-index move
        const idx = Math.floor(Math.random() * choices.length);
        const move = choices[idx];
        doMove(move.isHoriz, move.r, move.c);
      }, 600);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [mode, turn, state, gameOver]);

  function getAvailableLines({ horiz, vert }) {
    const res = [];
    for (let r = 0; r < horiz.length; ++r)
      for (let c = 0; c < horiz[0].length; ++c)
        if (!horiz[r][c]) res.push({ isHoriz: true, r, c });
    for (let r = 0; r < vert.length; ++r)
      for (let c = 0; c < vert[0].length; ++c)
        if (!vert[r][c]) res.push({ isHoriz: false, r, c });
    return res;
  }

  function doMove(isHoriz, r, c) {
    if (gameOver) return;
    const { horiz, vert, owner } = JSON.parse(JSON.stringify(state));
    if (isHoriz ? horiz[r][c] : vert[r][c]) return; // already drawn

    if (isHoriz) horiz[r][c] = true;
    else vert[r][c] = true;

    // Check for completed boxes
    const madeBox = [];
    if (isHoriz) {
      // Above
      if (
        r > 0 &&
        [horiz[r - 1][c], vert[r - 1][c], vert[r - 1][c + 1], horiz[r][c]].every(
          Boolean
        ) &&
        owner[r - 1][c] == null
      ) {
        owner[r - 1][c] = turn;
        madeBox.push([r - 1, c]);
      }
      // Below
      if (
        r < BOARD_ROWS &&
        [horiz[r][c], vert[r][c], vert[r][c + 1], horiz[r + 1]?.[c]].every(
          Boolean
        ) &&
        owner[r][c] == null &&
        r < BOARD_ROWS
      ) {
        owner[r][c] = turn;
        madeBox.push([r, c]);
      }
    } else {
      // Left
      if (
        c > 0 &&
        [horiz[r][c - 1], vert[r][c - 1], vert[r][c], horiz[r + 1][c - 1]].every(
          Boolean
        ) &&
        owner[r][c - 1] == null
      ) {
        owner[r][c - 1] = turn;
        madeBox.push([r, c - 1]);
      }
      // Right
      if (
        c < BOARD_COLS &&
        [horiz[r][c], vert[r][c], vert[r][c + 1], horiz[r + 1][c]].every(Boolean) &&
        owner[r][c] == null &&
        c < BOARD_COLS
      ) {
        owner[r][c] = turn;
        madeBox.push([r, c]);
      }
    }

    const newScore = [...score];
    madeBox.forEach(() => newScore[turn]++);
    const totalBoxes = BOARD_ROWS * BOARD_COLS;
    let finished = false;
    if (newScore[0] + newScore[1] === totalBoxes) {
      setGameOver(true);
      finished = true;
    }

    setState({ horiz, vert, owner });
    setScore(newScore);
    // Only switch turn if didn't make a box!
    if (!madeBox.length && !finished)
      setTurn((turn + 1) % 2);
  }

  function handleLine(isHoriz, r, c) {
    if (mode === "cpu" && turn === 1) return; // don't allow user to play for computer
    doMove(isHoriz, r, c);
  }

  function resetGame() {
    setState(createInitialState(BOARD_ROWS, BOARD_COLS));
    setScore([0, 0]);
    setTurn(0);
    setGameOver(false);
  }

  function handleModeSelect(selected) {
    setMode(selected);
    resetGame();
  }

  // --------- UI ---------
  return (
    <div className="dnb-app">
      <div className="dnb-header">
        <span role="img" aria-label="dots">
          🔵
        </span>{" "}
        Dots and Boxes
      </div>
      {!mode ? (
        <div className="dnb-modal">
          <h2>Choose Mode</h2>
          <button className="dnb-btn" onClick={() => handleModeSelect("2p")}>
            2 Player
          </button>
          <button className="dnb-btn" onClick={() => handleModeSelect("cpu")}>
            Player vs Computer
          </button>
        </div>
      ) : (
        <>
          <div className="dnb-info">
            {gameOver ? (
              <>
                <span>
                  Game Over!{" "}
                  {score[0] === score[1]
                    ? "It's a draw."
                    : score[0] > score[1] ? (
                        <b className="dnb-red">
                          {mode === "2p"
                            ? "Red wins!"
                            : "You win!"}
                        </b>
                      ) : (
                        <b className="dnb-blue">
                          {mode === "2p"
                            ? "Blue wins!"
                            : "Computer wins!"}
                        </b>
                      )}
                </span>
                <button className="dnb-btn" onClick={resetGame}>
                  Play Again
                </button>
              </>
            ) : (
              <>
                <span>
                  Turn:{" "}
                  <span
                    className={turn === 0 ? "dnb-red" : "dnb-blue"}
                  >
                    {mode === "2p"
                      ? turn === 0
                        ? "Red"
                        : "Blue"
                      : turn === 0
                        ? "You"
                        : "Computer"}
                  </span>
                </span>
                <button className="dnb-btn" onClick={resetGame}>
                  Reset
                </button>
              </>
            )}
            <div className="dnb-score">
              <span>
                <span className="dnb-red">
                  {mode === "2p" ? "Red" : "You"}
                </span>
                :<b>{score[0]}</b>
              </span>{" "}
              |{" "}
              <span>
                <span className="dnb-blue">
                  {mode === "2p" ? "Blue" : "Computer"}
                </span>
                :<b>{score[1]}</b>
              </span>
            </div>
          </div>
          <DnbBoard
            state={state}
            handleLine={handleLine}
            rows={BOARD_ROWS}
            cols={BOARD_COLS}
            gameOver={gameOver}
          />
          <div className="dnb-legend">
            <div className="dnb-dot"></div>
            <span>
              Click lines to play. Completing a box lets you move again!
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function DnbBoard({ state, handleLine, rows, cols, gameOver }) {
  const { horiz, vert, owner } = state;

  // Render as a grid of (2*rows+1) x (2*cols+1)
  const elements = [];
  for (let r = 0; r < rows * 2 + 1; r++) {
    const row = [];
    for (let c = 0; c < cols * 2 + 1; c++) {
      if (r % 2 === 0 && c % 2 === 0) {
        row.push(<div className="dnb-dot" key={c}></div>);
      } else if (r % 2 === 0 && c % 2 === 1) {
        const hr = r / 2;
        const hc = (c - 1) / 2;
        row.push(
          <div
            className={
              "dnb-line dnb-horiz" +
              (horiz[hr][hc] ? " dnb-active" : "")
            }
            key={c}
            onClick={() =>
              !gameOver && !horiz[hr][hc] ? handleLine(true, hr, hc) : undefined
            }
          />
        );
      } else if (r % 2 === 1 && c % 2 === 0) {
        const vr = (r - 1) / 2;
        const vc = c / 2;
        row.push(
          <div
            className={
              "dnb-line dnb-vert" +
              (vert[vr][vc] ? " dnb-active" : "")
            }
            key={c}
            onClick={() =>
              !gameOver && !vert[vr][vc]
                ? handleLine(false, vr, vc)
                : undefined
            }
          />
        );
      } else {
        const br = (r - 1) / 2;
        const bc = (c - 1) / 2;
        let boxClass = "dnb-box";
        if (owner[br][bc] === 0) boxClass += " dnb-redbox";
        else if (owner[br][bc] === 1) boxClass += " dnb-bluebox";
        row.push(<div className={boxClass} key={c}></div>);
      }
    }
    elements.push(
      <div className="dnb-board-row" key={r}>
        {row}
      </div>
    );
  }
  return <div className="dnb-board">{elements}</div>;
}
