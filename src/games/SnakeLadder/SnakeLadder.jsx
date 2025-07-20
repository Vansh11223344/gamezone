import React, { useState, useEffect } from "react";

// Board configuration (logic stays as in your version)
const BOARD_SIZE = 10;
const WIN_CELL = 100;
const LADDERS = [
  [3, 22], [5, 8], [15, 26], [20, 29], [27, 56], [36, 55],
  [43, 77], [62, 81], [71, 91], [78, 98]
];
const SNAKES = [
  [99, 7], [97, 25], [92, 35], [87, 58], [54, 34], [62, 19], [64, 60]
];

const LADDER_STARTS = LADDERS.map(l => l[0]);
const SNAKE_HEADS  = SNAKES.map(s => s[0]);

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function playerNames(idx, mode) {
  if (mode === "cpu") return idx === 0 ? "You" : "Computer";
  return idx === 0 ? "Player 1" : "Player 2";
}

export default function SnakeLadder() {
  const [mode, setMode] = useState(null);
  const [player, setPlayer] = useState(0);
  const [pos, setPos] = useState([1,1]);
  const [dice, setDice] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [message, setMessage] = useState("");

  // CPU auto-roll
  useEffect(() => {
    if (winner || mode !== "cpu" || player !== 1 || rolling || isAnimating) return;
    const timer = setTimeout(() => handleDice(), 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [player, mode, winner, rolling, isAnimating]);

  function startGame(selected) {
    setMode(selected);
    setPlayer(0);
    setPos([1,1]);
    setDice(null);
    setRolling(false);
    setWinner(null);
    setIsAnimating(false);
    setMessage("");
  }

  function checkSnakeLadder(cell) {
    const ladder = LADDERS.find(([from]) => from === cell);
    if (ladder) return { newPos: ladder[1], type: 'ladder' };
    const snake = SNAKES.find(([from]) => from === cell);
    if (snake) return { newPos: snake[1], type: 'snake' };
    return { newPos: cell, type: 'none' };
  }

  function movePlayer(playerIndex, diceValue) {
    const currentPos = pos[playerIndex];
    const attemptedPos = currentPos + diceValue;

    if (attemptedPos > WIN_CELL) {
      setMessage(`${playerNames(playerIndex, mode)} rolled ${diceValue} but would overshoot! Stay at ${currentPos}.`);
      setTimeout(() => {
        setPlayer(p => (p+1) % (mode === '2p' ? 2 : 1));
        setMessage('');
      }, 1400);
      return;
    }

    setIsAnimating(true);

    setTimeout(() => {
      setPos(prev => {
        const next = [...prev];
        next[playerIndex] = attemptedPos;
        return next;
      });

      if (attemptedPos === WIN_CELL) {
        setTimeout(() => {
          setWinner(playerIndex);
          setIsAnimating(false);
          setMessage(`🎉 ${playerNames(playerIndex, mode)} wins!`);
        }, 500);
        return;
      }

      setTimeout(() => {
        const {newPos: finalPos, type} = checkSnakeLadder(attemptedPos);
        if (type === 'ladder') {
          setMessage(`${playerNames(playerIndex, mode)} climbed a ladder from ${attemptedPos} to ${finalPos}!`);
          setPos(prev => {
            const next = [...prev];
            next[playerIndex] = finalPos;
            return next;
          });
          if (finalPos === WIN_CELL) {
            setTimeout(() => {
              setWinner(playerIndex);
              setIsAnimating(false);
              setMessage(`🎉 ${playerNames(playerIndex, mode)} wins!`);
            }, 1000);
            return;
          }
        } else if (type === 'snake') {
          setMessage(`${playerNames(playerIndex, mode)} got bitten by a snake! Slide from ${attemptedPos} to ${finalPos}!`);
          setPos(prev => {
            const next = [...prev];
            next[playerIndex] = finalPos;
            return next;
          });
        }
        setTimeout(() => {
          setPlayer(p => (p+1) % (mode === '2p' ? 2 : 1));
          setIsAnimating(false);
          setMessage('');
        }, type !== 'none' ? 1600 : 700);
      }, 400);
    }, 450);
  }

  function handleDice() {
    if (rolling || winner !== null || isAnimating) return;
    setRolling(true);
    setMessage("");
    setTimeout(() => {
      const diceValue = rollDie();
      setDice(diceValue);
      setRolling(false);
      movePlayer(player, diceValue);
    }, 600);
  }

  return (
    <div className="snl-outer">
      <style>{snlCSS}</style>
      {!mode ? (
        <div className="snl-modal">
          <h2>🐍 Snakes &amp; Ladders 🪜</h2>
          <button className="snl-btn snl-btn-main" onClick={()=> startGame("2p")}>Two Players</button>
          <button className="snl-btn" onClick={()=> startGame("cpu")}>1 vs Computer</button>
        </div>
      ) : <>
        <div className="snl-header">
          <div className={`snl-turn snl-p${player}` + (winner!==null ? " snl-highlight":"")}>
            {winner !== null
              ? <>🏆 <b>{playerNames(winner,mode)}</b> Wins!</>
              : <>Turn: <b>{playerNames(player,mode)}</b></>}
          </div>
          <button className="snl-btn snl-btn-reset" onClick={() => startGame(mode)}>Reset</button>
          <div className="snl-dice-wrap">
            <button 
              className="snl-dice-btn"
              disabled={
                rolling || winner !== null || (mode==='cpu' && player===1) || isAnimating
              }
              onClick={handleDice}
            >
              <span className="snl-dice-num">
                {dice || '🎲'}
              </span>
            </button>
          </div>
        </div>
        <div className="snl-msgs">
          {message
            || (winner!==null ? `🎉 ${playerNames(winner,mode)} wins! 🎉`
            : `${playerNames(player,mode)}'s turn — Roll the dice!`)}
        </div>
        <div className="snl-board-wrap">
          <SnlBoard
            pos={pos}
            player={player}
            winner={winner}
          />
        </div>
        <div className="snl-msgs" style={{marginTop: 0}}>
          <span style={{color:"#869c03"}}>
            {mode==='cpu'
              ? "You are red, Computer is blue. Reach 100 to win!"
              : "Red: Player 1, Blue: Player 2. First to 100 wins!"}
          </span>
        </div>
      </>}
    </div>
  );
}

function SnlBoard({pos, player, winner}) {
  // Render 10x10 grid, snaking left-right, right-left
  let cells = [];
  for(let r=0;r<10;r++) {
    let row = [];
    for(let c=0;c<10;c++) {
      let idx = r*10 + (r % 2 === 0 ? c : (9-c));
      let cellNum = 100-idx;
      let isSnake = SNAKE_HEADS.includes(cellNum);
      let isLadder = LADDER_STARTS.includes(cellNum);
      let p0 = pos[0]===cellNum, p1 = pos[1]===cellNum;
      let isHighlight = (p0&&player===0 || p1&&player===1) && winner===null;
      row.push(
        <div
          className={[
            "snl-cell",
            isSnake ? "snl-snake-start" : "",
            isLadder? "snl-ladder-start" : "",
            isHighlight ? "snl-highlight" : ""
          ].join(' ')}
          key={cellNum}
        >
          {/* Number (Bottom Right) */}
          <div className="snl-num">{cellNum}</div>
          {/* Token(s) */}
          {p0 && <div className="snl-token snl-token1"></div>}
          {p1 && <div className="snl-token snl-token2"></div>}
          {/* Snake/Ladder Icon */}
          <div style={{position:'absolute',top:'0.1rem',left:'0.2rem'}}>
            {isSnake && <span role="img" aria-label="snake">🐍</span>}
            {isLadder && <span role="img" aria-label="ladder">🪜</span>}
          </div>
          {/* Arrow Info */}
          <div style={{position:'absolute',top:'1.3rem',left:'0.21rem',fontSize:'0.67em',color:'#9d776c',opacity:0.78}}>
            {isSnake && <span>
              → {SNAKES.find(([h])=>h===cellNum)?.[1]}
            </span>}
            {isLadder && <span>
              → {LADDERS.find(([s])=>s===cellNum)?.[1]}
            </span>}
          </div>
        </div>
      );
    }
    cells = cells.concat(row);
  }
  return (
    <div className="snl-board">
      {cells}
    </div>
  );
}

// CSS string for <style>{snlCSS}</style>
const snlCSS = `
.snl-outer {
  background: linear-gradient(135deg, #f6e18c 65%, #cef2b1 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
  padding: 1.5rem 0;
  box-sizing: border-box;
}
.snl-modal {
  background: #fcf5da;
  border-radius: 1rem;
  margin: 2rem auto 0;
  padding: 2rem;
  max-width: 90%;
  width: 400px;
  box-shadow: 0 4px 30px rgba(170, 220, 54, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.snl-modal h2 {
  letter-spacing: 0.05em;
  color: #356d08;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  font-weight: bold;
}
.snl-btn {
  padding: 0.8rem 2rem;
  background: linear-gradient(90deg, #e5da19 60%, #e1bf30 100%);
  color: #384801;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 0.8rem;
  border: none;
  margin-bottom: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(255, 218, 27, 0.3);
  transition: background 0.2s, transform 0.1s;
}
.snl-btn:hover {
  background: #e9ed6f;
  transform: scale(1.05);
}
.snl-btn-reset {
  padding: 0.6rem 1.5rem;
  background: #dfdb85;
}
.snl-btn-main {
  background: linear-gradient(90deg, #f5de01 45%, #e3df32 100%);
}
.snl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 251, 199, 0.8);
  width: 90%;
  max-width: 500px;
  border-radius: 1rem;
  margin: 1rem auto;
  padding: 0.8rem 1.2rem;
  font-weight: 700;
  font-size: 1.1rem;
  color: #384d01;
}
.snl-dice-wrap {
  margin-left: 0.8rem;
}
.snl-dice-btn {
  background: linear-gradient(#fff248 60%, #e3e655 100%);
  border-radius: 0.7rem;
  border: 2px solid #b3b330;
  font-size: 1.5rem;
  font-weight: bold;
  box-shadow: 0 2px 10px rgba(255, 245, 171, 0.3);
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}
.snl-dice-btn:disabled {
  background: #e2efc1;
  color: #d3cf90;
  cursor: not-allowed;
}
.snl-dice-num {
  font-size: 1.2rem;
  font-family: 'Fira Mono', monospace;
  color: #c7ad07;
  font-weight: 900;
}
.snl-turn {
  letter-spacing: 0.03em;
  font-weight: 600;
}
.snl-p0 { color: #df211d; }
.snl-p1 { color: #277ee6; }
.snl-board-wrap {
  width: 90%;
  max-width: 500px;
  margin: 1rem auto;
}
.snl-board {
  width: 100%;
  aspect-ratio: 1/1;
  display: grid;
  grid-template: repeat(10, 1fr) / repeat(10, 1fr);
  position: relative;
  background: #fcf6cd;
  border-radius: 1.2rem;
  box-shadow: 0 6px 20px rgba(220, 217, 39, 0.2);
  border: 5px solid #e1bd32;
  overflow: hidden;
}
.snl-cell {
  border: 1px solid #eadfbe;
  background: #fcf7eb;
  position: relative;
  font-size: clamp(0.9rem, 2vw, 1rem);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  min-width: 0;
  min-height: 0;
}
.snl-snake-start { background: #e5ffe8; }
.snl-ladder-start { background: #fff5c3; }
.snl-num {
  font-size: clamp(0.7rem, 1.8vw, 0.85rem);
  color: #beae19;
  font-weight: bold;
  position: absolute;
  bottom: 0.3rem;
  right: 0.4rem;
  opacity: 0.95;
  pointer-events: none;
  user-select: none;
}
.snl-token {
  position: absolute;
  width: clamp(1rem, 2.5vw, 1.2rem);
  height: clamp(1rem, 2.5vw, 1.2rem);
  border-radius: 50%;
  border: 3px solid #567a1c;
  box-shadow: 0 2px 6px rgba(93, 97, 3, 0.2);
  z-index: 3;
  pointer-events: none;
  transition: left 0.15s, top 0.15s;
}
.snl-token1 {
  background: linear-gradient(135deg, #ed4742 40%, #a60311 100%);
  border-color: #b80d09;
}
.snl-token2 {
  background: linear-gradient(135deg, #2f81e9 36%, #194398 100%);
  border-color: #123383;
}
.snl-highlight {
  box-shadow: 0 0 5px 2px rgba(115, 255, 62, 0.5);
  background: #fff8e7 !important;
}
.snl-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  overflow: visible;
}
.snl-msgs {
  width: 90%;
  max-width: 500px;
  margin: 0.5rem auto;
  background: rgba(255, 250, 218, 0.9);
  color: #f1460f;
  font-size: clamp(0.9rem, 2.2vw, 1rem);
  font-weight: 600;
  border-radius: 0.9rem;
  box-shadow: 0 2px 10px rgba(255, 232, 169, 0.2);
  padding: 0.8rem 1rem;
  text-align: center;
  letter-spacing: 0.01em;
}
.snl-msgs b { color: #b8ae2c; }
@media (max-width: 600px) {
  .snl-outer { padding: 0.5rem; }
  .snl-modal { width: 95%; padding: 1.5rem; margin: 1rem auto; }
  .snl-modal h2 { font-size: 1.5rem; }
  .snl-btn { padding: 0.6rem 1.5rem; font-size: 1rem; }
  .snl-header { flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; font-size: 1rem; }
  .snl-dice-wrap { margin-left: 0; }
  .snl-dice-btn { padding: 0.3rem 0.6rem; font-size: 1.2rem; }
  .snl-dice-num { font-size: 1rem; }
  .snl-board-wrap { width: 95%; }
  .snl-board { border: 3px solid #e1bd32; }
}
@media (max-width: 400px) {
  .snl-token { width: 0.8rem; height: 0.8rem; border-width: 2px; }
  .snl-num { font-size: 0.6rem; bottom: 0.2rem; right: 0.3rem; }
  .snl-msgs { font-size: 0.8rem; padding: 0.6rem; }
}
`;
// end snlCSS

