import React, { useState, useRef } from "react";
import "./ReactionTest.css";

function getRandomWait() {
  // 1.8 to 3.5 seconds
  return 1800 + Math.random() * 1700;
}

export default function ReactionTest() {
  const [phase, setPhase] = useState("waiting"); // waiting, ready, go, result, tooSoon
  const [waitId, setWaitId] = useState(null);
  const [t0, setT0] = useState(null);
  const [time, setTime] = useState(null);
  const [results, setResults] = useState([]);
  const best = results.length ? Math.min(...results) : null;
  const avg = results.length
    ? Math.round(results.reduce((a, b) => a + b, 0) / results.length)
    : null;

  // Start a new test
  function startTest() {
    setPhase("ready");
    setTime(null);
    const to = setTimeout(() => {
      setPhase("go");
      setT0(performance.now());
    }, getRandomWait());
    setWaitId(to);
  }

  // If they click/tap before green: false start!
  function handleUserAction() {
    if (phase === "waiting") startTest();
    else if (phase === "ready") {
      clearTimeout(waitId);
      setPhase("tooSoon");
    } else if (phase === "go" && t0) {
      const reaction = Math.round(performance.now() - t0);
      setTime(reaction);
      setResults(res => [...res.slice(-9), reaction]);
      setPhase("result");
    } else if (phase === "result" || phase === "tooSoon") {
      setPhase("waiting");
    }
  }

  // Keyboard/tap support
  React.useEffect(() => {
    function onKey(e) {
      if (
        e.key === " " ||
        e.key === "Enter" ||
        e.key === "Spacebar" ||
        e.key === "ArrowUp"
      ) {
        e.preventDefault();
        handleUserAction();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line
  }, [phase, t0, waitId]);

  return (
    <div className="reaction-container">
      <h2 className="reaction-title">ReactionTest</h2>
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
        aria-label="Reaction test area"
      >
        {phase === "waiting" && (
          <div>
            <div className="reaction-hint">When the box turns <span style={{ color: "#27ff23" }}>green</span>, tap/click as fast as you can!</div>
            <div className="reaction-bigbtn">Tap / Click to START</div>
          </div>
        )}
        {phase === "ready" && (
          <div>
            <div className="reaction-wait-icon">...</div>
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
            <div>Wait for green!<br /><span className="reaction-retry">Tap to retry</span></div>
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
          <b>Best: </b> {best !== null ? best + " ms" : "--"}
        </span>
        <span>
          <b>Average: </b> {avg !== null ? avg + " ms" : "--"}
        </span>
        <span>
          <b>Tests:</b> {results.length}
        </span>
      </div>
      <div className="reaction-footer">
        <span>
          <b>Tip:</b> Try a few times! Lower reaction is better.<br />
          (Works on tap, click, space, enter)
        </span>
      </div>
    </div>
  );
}
