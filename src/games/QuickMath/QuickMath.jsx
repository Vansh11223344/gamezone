import React, { useState, useRef, useEffect } from "react";
import "./QuickMath.css";

function randomMath() {
  const ops = [
    { sign: "+", fn: (a, b) => a + b },
    { sign: "-", fn: (a, b) => a - b },
    { sign: "×", fn: (a, b) => a * b },
    { sign: "÷", fn: (a, b) => Math.floor(a / b), safe: (a, b) => b > 0 && a % b === 0 }
  ];
  let op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, ans;
  while (true) {
    a = Math.floor(Math.random() * 21) + 4; // 4-24
    b = Math.floor(Math.random() * 14) + 2; // 2-15
    if (op.sign === "-" && a < b) [a, b] = [b, a];
    if (op.sign === "÷" && (!op.safe || !op.safe(a, b))) continue;
    ans = op.fn(a, b);
    if (op.sign === "÷" && ans > 20) continue;
    break;
  }
  return { left: a, right: b, op: op.sign, ans };
}

const TIMER_SECONDS = 20;

export default function QuickMath() {
  const [question, setQuestion] = useState(randomMath());
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null); // "correct", "wrong", or null
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [gameover, setGameover] = useState(false);
  const timerRef = useRef();

  // Timer effect
  useEffect(() => {
    if (gameover) return;
    timerRef.current = setInterval(() => {
      setTimer(t =>
        t > 0 ? t - 1 : 0
      );
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [question, gameover]);

  // On timer runs out
  useEffect(() => {
    if (timer === 0 && !gameover) {
      finish(false, "Time's up!");
    }
    // eslint-disable-next-line
  }, [timer]);

  function finish(isCorrect, message) {
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setScore(s => s + 1);
      setStreak(n => n + 1);
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      if (!isCorrect) setGameover(true);
      else nextQuestion();
    }, 800);
  }

  // Accept input
  function handleDigit(d) {
    if (gameover) return;
    if (input.length > 6) return;
    setInput(val => (val === "0" ? d : val + d));
  }
  function handleClear() {
    if (gameover) return;
    setInput("");
  }
  function handleSubmit() {
    if (gameover) return;
    let n = +input;
    if (isNaN(n) || input === "") return;
    finish(n === question.ans, n === question.ans ? "Correct!" : "Wrong!");
  }
  function nextQuestion() {
    setQuestion(randomMath());
    setInput("");
    setFeedback(null);
    setTimer(TIMER_SECONDS);
  }
  function handleRestart() {
    setScore(0);
    setStreak(0);
    setGameover(false);
    setQuestion(randomMath());
    setInput("");
    setFeedback(null);
    setTimer(TIMER_SECONDS);
  }

  // Keyboard support
  useEffect(() => {
    const kdown = e => {
      if (gameover) {
        if (e.key === "Enter" || e.key === " " || e.key === "r" || e.key === "R") handleRestart();
        return;
      }
      if (e.key === "Enter") handleSubmit();
      if (e.key === "Backspace") setInput(v => v.slice(0, -1));
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      if (e.key === "c" || e.key === "C" || e.key === "Escape") handleClear();
    };
    window.addEventListener("keydown", kdown);
    return () => window.removeEventListener("keydown", kdown);
    // eslint-disable-next-line
  }, [input, question, gameover]);

  // Responsive dynamic button grid
  const btnVals = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    ["C", 0, "OK"],
  ];
  function btnAction(v) {
    if (v === "C") handleClear();
    else if (v === "OK") handleSubmit();
    else handleDigit("" + v);
  }

  return (
    <div className="qm-container">
      <h2 className="qm-title">QuickMath</h2>
      <div className="qm-topbar">
        <span>Score: <b>{score}</b></span>
        <span>Streak: <b>{streak}</b></span>
        <span
          className={
            "qm-timer " +
            (timer < 5 ? "danger" :
             timer < 10 ? "warn" : "")
          }
        >{timer}s</span>
        <button className="qm-btn" onClick={handleRestart}>Restart</button>
      </div>
      <div className="qm-quizbox">
        <div className="qm-equation">
          <span className="qm-num">{question.left}</span>
          <span className="qm-op">{question.op}</span>
          <span className="qm-num">{question.right}</span>
          <span className="qm-eq">=</span>
          <span className={"qm-input" +
            (feedback === "correct" ? " correct" : feedback === "wrong" ? " wrong" : "")}
          >
            {input || "?"}
          </span>
        </div>
        {gameover
          ? <div className="qm-gameover">Game over!<br /><b>Your score: {score}</b><br />
              <button className="qm-btn" onClick={handleRestart}>Play Again</button>
            </div>
          : feedback &&
            <div className={
              "qm-feedback " +
              (feedback === "correct" ? "yes" : "no")
            }>
              {feedback === "correct" ? "✔ Correct!" : "✗ Wrong!"}
            </div>
        }
      </div>
      <div className="qm-numpad">
        {btnVals.map((row, i) => (
          <div className="qm-numpad-row" key={i}>
            {row.map((v, j) => (
              <button
                key={j}
                className={
                  `qm-padbtn${typeof v === "string" && v.length > 1 ? " big" : ""}` +
                  (v === "OK" ? " qm-ok" : v === "C" ? " qm-clear" : "")
                }
                disabled={gameover && v !== "C" && v !== "OK"}
                onClick={() => btnAction(v)}
                tabIndex={0}
              >{v}</button>
            ))}
          </div>
        ))}
      </div>
      <div className="qm-footer">
        <b>How to play:</b> Solve as many as you can before the time runs out!
        <br />Type, tap, or use arrow keys. Fast math, quick mind!
      </div>
    </div>
  );
}
