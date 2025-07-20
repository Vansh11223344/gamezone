import React, { useState, useEffect, useRef } from "react";
import "./SimonSays.css";

// Simon colors
const COLORS = [
  { id: 0, name: "green",  color: "#29b64e", sound: 329.63 },
  { id: 1, name: "red",    color: "#df273e", sound: 261.63 },
  { id: 2, name: "yellow", color: "#fdc332", sound: 220.00 },
  { id: 3, name: "blue",   color: "#195dff", sound: 164.81 }
];

const getRandomColor = () => Math.floor(Math.random() * 4);

export default function SimonSays() {
  const [sequence, setSequence] = useState([getRandomColor()]);
  const [step, setStep] = useState(0);
  const [userStep, setUserStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activePad, setActivePad] = useState(null);
  const [status, setStatus] = useState("Ready");
  const [score, setScore] = useState(0);
  const [strict, setStrict] = useState(false);
  const [showStart, setShowStart] = useState(true);

  const timeoutRef = useRef();

  useEffect(() => {
    if (playing) {
      playSequence();
    }
    // cleanup on dismount
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line
  }, [playing, sequence, score]);

  // Playback Simon's sequence
  const playSequence = async () => {
    setStatus("Watch");
    setUserStep(0);
    for (let i = 0; i < sequence.length; i++) {
      await glowPad(sequence[i], 500);
      await pause(180);
    }
    setStatus("Repeat");
    setActivePad(null);
  };

  // Glow a pad and play beep
  function glowPad(idx, duration = 500) {
    setActivePad(idx);
    playTone(COLORS[idx].sound, duration - 60);
    return new Promise(resolve =>
      setTimeout(() => {
        setActivePad(null);
        resolve();
      }, duration)
    );
  }

  // Player input
  function handlePad(idx) {
    if (status !== "Repeat" || playing === false) return;
    setActivePad(idx);
    playTone(COLORS[idx].sound, 290);
    if (sequence[userStep] === idx) {
      if (userStep + 1 === sequence.length) {
        // Finish round
        setScore(sequence.length);
        setStatus("Good! +1");
        setTimeout(() => {
          setSequence(seq => [...seq, getRandomColor()]);
        }, 700);
        setTimeout(() => {
          setStatus("Listen");
        }, 680);
      } else {
        setUserStep(userStep + 1);
      }
    } else {
      setStatus("Wrong!");
      playTone(110, 550);
      if (strict) {
        setTimeout(() => {
          setScore(0);
          setSequence([getRandomColor()]);
        }, 1000);
      }
      setTimeout(() => {
        if (!strict) playSequence();
        else setStatus("Listen");
      }, 1050);
    }
    setTimeout(() => setActivePad(null), 200);
  }

  // Start/restart game
  function startGame() {
    setScore(0);
    setSequence([getRandomColor()]);
    setPlaying(true);
    setShowStart(false);
    setStatus("Listen");
  }

  // End game if player wins (typical: 20 steps)
  useEffect(() => {
    if (score >= 20) {
      setStatus("🎉 You Win!");
      setTimeout(() => {
        setShowStart(true);
        setPlaying(false);
      }, 1700);
    }
  }, [score]);

  // Audio context for beeps
  function playTone(freq, duration = 300) {
    if (!window.AudioContext) return;
    let ctx = new (window.AudioContext || window.webkitAudioContext)();
    let o = ctx.createOscillator();
    let g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    g.gain.value = 0.15;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + duration / 1000);
    o.onended = () => ctx.close();
  }

  function pause(ms) {
    return new Promise(res => timeoutRef.current = setTimeout(res, ms));
  }

  function stopGame() {
    setPlaying(false);
    setShowStart(true);
    setStatus("Stopped");
    setScore(0);
    setSequence([getRandomColor()]);
  }

  function toggleStrict() {
    setStrict(s => !s);
  }

  return (
    <div className="simon-outer">
      <div className="simon-title">Simon Says</div>
      <div className="simon-gamebox">
        <div className="simon-board">
          {COLORS.map((col, idx) => (
            <button
              key={col.name}
              className={
                "simon-pad simon-" +
                col.name +
                (activePad === idx ? " active" : "")
              }
              disabled={!playing || status === "Watch"}
              onPointerDown={() => handlePad(idx)}
              onClick={() => handlePad(idx)}
              tabIndex={0}
              aria-label={col.name}
            />
          ))}
          <div className="simon-center">
            <div className="simon-score">{score}</div>
            <div className={"simon-status" + (status === "Wrong!" ? " wrong" : "")}>{status}</div>
            <button className="simon-btn" onClick={startGame}>
              {showStart ? "Start" : "Restart"}
            </button>
            <button className={"simon-btn simon-strict" + (strict ? " strict-on" : "")} onClick={toggleStrict} aria-pressed={strict}>
              Strict: {strict ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>
      <div className="simon-footer">
        <ul>
          <li>Watch the pads light up in sequence, then repeat them.</li>
          <li>Each round adds one color to the sequence.</li>
          <li>Turn <b>Strict</b> mode ON for real challenge!</li>
          <li>Perfect for memory training—get to 20 steps to win.</li>
        </ul>
      </div>
    </div>
  );
}
