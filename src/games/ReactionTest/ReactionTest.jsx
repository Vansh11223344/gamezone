import React, { useState, useRef, useEffect } from "react";
import "./ReactionTest.css";

function getRandomWait() {
  // 1.5 to 3.5 seconds
  return 1500 + Math.random() * 2000;
}

export default function ReactionTest() {
  const [phase, setPhase] = useState("waiting"); // waiting, ready, go, result, tooSoon
  const [waitId, setWaitId] = useState(null);
  const [t0, setT0] = useState(null);
  const [time, setTime] = useState(null);
  const [results, setResults] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true); // Sound toggle
  const [progress, setProgress] = useState(0); // Progress for ready phase
  const progressRef = useRef(null);
  const best = results.length ? Math.min(...results) : null;
  const avg = results.length
    ? Math.round(results.reduce((a, b) => a + b, 0) / results.length)
    : null;

  // Sound effects
  const playSound = (type) => {
    if (!soundEnabled) return;
    const audio = new Audio(
      type === "click"
        ? "https://assets.mixkit.co/sfx/preview/mixkit-click-button-1110.mp3"
        : type === "success"
        ? "https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3"
        : "https://assets.mixkit.co/sfx/preview/mixkit-error-1008.mp3"
    );
    audio.play().catch(() => {}); // Handle potential errors
  };

  // Start a new test
  function startTest() {
    setPhase("ready");
    setTime(null);
    setProgress(0);
    const to = setTimeout(() => {
      setPhase("go");
      setT0(performance.now());
      setProgress(100);
      playSound("success");
    }, getRandomWait());
    setWaitId(to);

    // Progress animation
    progressRef.current = setInterval(() => {
      setProgress((prev) => Math.min(prev + 100 / (getRandomWait() / 100), 100));
    }, 100);
  }

  // Handle user action
  function handleUserAction() {
    playSound("click");
    if (phase === "waiting") startTest();
    else if (phase === "ready") {
      clearTimeout(waitId);
      clearInterval(progressRef.current);
      setPhase("tooSoon");
      setProgress(0);
      playSound("error");
    } else if (phase === "go" && t0) {
      const reaction = Math.round(performance.now() - t0);
      setTime(reaction);
      setResults((res) => [...res.slice(-9), reaction]);
      setPhase("result");
      setProgress(0);
      playSound("success");
    } else if (phase === "result" || phase === "tooSoon") {
      setPhase("waiting");
      clearInterval(progressRef.current);
    }
  }

  // Reset results
  function resetResults() {
    setResults([]);
    setPhase("waiting");
    setTime(null);
    playSound("click");
  }

  // Toggle sound
  function toggleSound() {
    setSoundEnabled((prev) => !prev);
    playSound("click");
  }

  // Keyboard support
  useEffect(() => {
    function onKey(e) {
      if (
        e.key === " " ||
        e.key === "Enter" ||
        e.key === "Spacebar" ||
        e.key === "ArrowUp"
      ) {
        e.preventDefault();
        handleUserAction();
      } else if (e.key === "r" || e.key === "R") {
        resetResults();
      } else if (e.key === "s" || e.key === "S") {
        toggleSound();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, t0, waitId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(waitId);
      clearInterval(progressRef.current);
    };
  }, [waitId]);

  return (
    <div className="reaction-container">
      <div className="reaction-header">
        <h2 className="reaction-title">Reaction Test</h2>
        <div className="reaction-controls">
          <button
            className="reaction-btn sound-toggle"
            onClick={toggleSound}
            aria-label={soundEnabled ? "Disable sound" : "Enable sound"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
          <button
            className="reaction-btn reset-btn"
            onClick={resetResults}
            aria-label="Reset results"
          >
            Reset
          </button>
        </div>
      </div>
      <div
        className={
          "reaction-area " +
          (phase === "waiting"
            ? "wait"
            : phase === "ready"
            ? "ready"
            : phase === "go"
            ? "go"
            : phase === "tooSoon"
            ? "tooso"
            : "result")
        }
        tabIndex={0}
        onClick={handleUserAction}
        role="button"
        aria-label={`Reaction test area: ${phase}`}
      >
        {phase === "waiting" && (
          <div>
            <div className="reaction-hint">
              When the box turns <span style={{ color: "#27ff23" }}>green</span>,
              tap/click as fast as you can!
            </div>
            <button className="reaction-bigbtn">Start Test</button>
          </div>
        )}
        {phase === "ready" && (
          <div>
            <div className="reaction-progress">
              <div
                className="reaction-progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="reaction-waitmsg">Wait for it...</div>
          </div>
        )}
        {phase === "go" && (
          <div className="reaction-now">
            <div className="reaction-gobtn">GO!</div>
          </div>
        )}
        {phase === "tooSoon" && (
          <div className="reaction-alert">
            <span>⛔ Too Soon!</span>
            <div>
              Wait for green!
              <br />
              <span className="reaction-retry">Tap to retry</span>
            </div>
          </div>
        )}
        {phase === "result" && (
          <div className="reaction-result">
            <span>⏱️</span>
            <div>
              Your reaction:
              <br />
              <span className="reaction-ms">{time} ms</span>
              <div className="reaction-small">
                <b>Tap</b> or <b>press space/enter</b> to try again!
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="reaction-results">
        <span>
          <b>Best:</b> {best !== null ? best + " ms" : "--"}
        </span>
        <span>
          <b>Average:</b> {avg !== null ? avg + " ms" : "--"}
        </span>
        <span>
          <b>Tests:</b> {results.length}
        </span>
      </div>
      <div className="reaction-footer">
        <span>
          <b>Tip:</b> Try multiple times to improve your score! Lower is better.
          <br />
          (Tap, click, space, enter, or 'R' to reset, 'S' to toggle sound)
        </span>
      </div>
    </div>
  );
}