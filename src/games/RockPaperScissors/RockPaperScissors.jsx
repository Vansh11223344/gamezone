import React, { useState } from "react";
import "./RockPaperScissors.css";
import { FaRegHandRock, FaRegHandScissors, FaRegHandPaper } from 'react-icons/fa';

const PLAYS = [
  {
    name: "rock",
    icon: <FaRegHandRock size={48}/>, // If using react-icons!
    icon: "✊"
  },
  {
    name: "paper",
    icon: <FaRegHandPaper size={48}/>,
    icon: "✋"
  },
  {
    name: "scissors",
    icon: <FaRegHandScissors size={48}/>,
    icon: "✌️"
  }
];

const WIN_MATRIX = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper"
};

function getRandomPlay() {
  const idx = Math.floor(Math.random() * 3);
  return PLAYS[idx].name;
}

export default function RockPaperScissors() {
  const [playerPick, setPlayerPick] = useState(null);
  const [cpuPick, setCpuPick] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ player: 0, cpu: 0, draw: 0 });

  function play(pick) {
    const cpu = getRandomPlay();
    setPlayerPick(pick);
    setCpuPick(cpu);
    let r;
    if (pick === cpu) {
      r = "draw";
    } else if (WIN_MATRIX[pick] === cpu) {
      r = "player";
    } else {
      r = "cpu";
    }
    setResult(r);
    setScore(s => ({
      player: s.player + (r === "player" ? 1 : 0),
      cpu: s.cpu + (r === "cpu" ? 1 : 0),
      draw: s.draw + (r === "draw" ? 1 : 0)
    }));
  }

  function reset() {
    setPlayerPick(null);
    setCpuPick(null);
    setResult(null);
  }

  return (
    <div className="rps-outer">
      <h1 className="rps-title">Rock&nbsp;Paper&nbsp;Scissors</h1>
      <div className="rps-score">
        <span className="rps-score-you">You: {score.player}</span>
        <span className="rps-score-draw">Draws: {score.draw}</span>
        <span className="rps-score-cpu">CPU: {score.cpu}</span>
      </div>
      <div className="rps-gamebox">
        <div className="rps-plays-row">
          {PLAYS.map(({ name, icon }) => (
            <button
              key={name}
              onClick={() => !result && play(name)}
              disabled={!!result}
              className={
                "rps-play" +
                (playerPick === name ? " selected" : "") +
                (result && result === "player" && playerPick === name ? " win" : "")
              }
              tabIndex={0}
              aria-label={name}
            >
              <span className="rps-icon">{icon}</span>
              <span className="rps-label">{name[0].toUpperCase() + name.slice(1)}</span>
            </button>
          ))}
        </div>
        <div className="rps-vs">
          <span>VS</span>
        </div>
        <div className="rps-plays-row rps-cpu-row">
          {PLAYS.map(({ name, icon }) => (
            <button
              key={name + "cpu"}
              className={
                "rps-play cpu" +
                (cpuPick === name ? " selected" : "") +
                (result && result === "cpu" && cpuPick === name ? " win" : "")
              }
              disabled
              aria-label={name}
            >
              <span className="rps-icon">{icon}</span>
              <span className="rps-label">{name[0].toUpperCase() + name.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>
      {result && (
        <div className="rps-result-outer">
          <div className={"rps-result " + result}>
            {result === "draw"
              ? <>🤝 It's a Draw!</>
              : result === "player"
              ? <>🎉 You Win!</>
              : <>💻 CPU Wins!</>}
          </div>
          <button className="rps-next-btn" onClick={reset}>
            {score.player === 5 || score.cpu === 5
              ? "Play Again"
              : "Next Round"}
          </button>
        </div>
      )}
      <div className="rps-footer">
        <span>First to 5 wins? Keep playing and see who rules!<br />
        <span style={{ color: "#ec5353" }}>Rock</span> beats Scissors, <span style={{ color: "#5eb7ed" }}>Scissors</span> beats Paper, <span style={{ color: "#ffce47" }}>Paper</span> beats Rock.</span>
      </div>
    </div>
  );
}
