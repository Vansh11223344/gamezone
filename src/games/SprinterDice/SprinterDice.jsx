import React, { useState } from "react";
import "./SprinterDice.css";

// Config: number of lanes, length of track
const LANES = 4;
const TRACK_LEN = 20;
const COLORS = ["#D32F2F", "#43A047", "#FBC02D", "#1565C0"];

function rollDie() {
  return 1 + Math.floor(Math.random() * 6);
}

export default function SprinterDice() {
  const [positions, setPositions] = useState(Array(LANES).fill(0));
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(null);
  const [winner, setWinner] = useState(null);
  const [rollCount, setRollCount] = useState(0);

  function doRoll() {
    if (winner !== null) return;
    const val = rollDie();
    setDice(val);
    setPositions((pos) => {
      const newPos = [...pos];
      newPos[turn] = Math.min(newPos[turn] + val, TRACK_LEN);
      if (newPos[turn] === TRACK_LEN && winner === null) {
        setWinner(turn);
      }
      return newPos;
    });
    setTurn((t) => (t + 1) % LANES);
    setRollCount((r) => r + 1);
  }

  function restart() {
    setPositions(Array(LANES).fill(0));
    setTurn(0);
    setDice(null);
    setWinner(null);
    setRollCount(0);
  }

  return (
    <div className="sprinterdice-container">
      <h1 className="sprinterdice-title">SprinterDice</h1>

      <div className="sprinterdice-toolbar">
        <div className="sprinterdice-lanes-indicator">
          {COLORS.map((c, i) => (
            <div
              key={i}
              className="sprinterdice-lane-indicator"
              style={{
                backgroundColor: c,
                opacity: winner === i ? 1 : 0.7,
                border:
                  turn === i && winner === null
                    ? "3px solid #fff"
                    : "3px solid transparent",
              }}
              aria-label={`Runner ${i + 1}`}
              title={`Runner ${i + 1}`}
            />
          ))}
        </div>

        <div className="sprinterdice-info">
          <span>
            {winner !== null
              ? `Winner: Runner ${winner + 1}!`
              : `Turn: Runner ${turn + 1}`}
          </span>
          <span>Rolls: {rollCount}</span>
          <button className="sprinterdice-btn" onClick={restart}>
            Restart
          </button>
        </div>
      </div>

      <div className="sprinterdice-board">
        {/* Exit area */}
        <div className="sprinterdice-exit" />
        {/* Track and pawns */}
        {Array.from({ length: LANES }).map((_, lane) => (
          <div key={lane} className="sprinterdice-lane">
            <div
              className="sprinterdice-lane-color"
              style={{ backgroundColor: COLORS[lane] }}
            >
              Lane {lane + 1}
            </div>
            <div className="sprinterdice-track">
              {Array.from({ length: TRACK_LEN + 1 }).map((_, pos) => (
                <div
                  key={pos}
                  className={`sprinterdice-cell ${
                    pos === TRACK_LEN ? "finish" : ""
                  } ${positions[lane] === pos ? "runner-present" : ""}`}
                >
                  {positions[lane] === pos && (
                    <div
                      className="sprinterdice-runner"
                      style={{ backgroundColor: COLORS[lane] }}
                      aria-label={`Runner ${lane + 1}`}
                    >
                      {lane + 1}
                    </div>
                  )}

                  {pos === TRACK_LEN && <span className="sprinterdice-flag">🏁</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sprinterdice-rollbar">
        <button
          className="sprinterdice-rollbtn"
          onClick={doRoll}
          disabled={winner !== null}
          aria-disabled={winner !== null}
        >
          Roll Dice 🎲
        </button>
        <div className="sprinterdice-currentroll" aria-live="polite">
          {dice !== null ? `Last Roll: ${dice}` : "Roll to start"}
        </div>
      </div>

      {winner !== null && (
        <div className="sprinterdice-winbox" role="alert" aria-live="assertive">
          <h2>🎉 Runner {winner + 1} wins!</h2>
          <p>Total Rolls: {rollCount}</p>
          <button className="sprinterdice-btn" onClick={restart}>
            Play Again
          </button>
        </div>
      )}

      <footer className="sprinterdice-footer">
        Classic SprinterDice | Responsive Boardgame Experience
      </footer>
    </div>
  );
}
