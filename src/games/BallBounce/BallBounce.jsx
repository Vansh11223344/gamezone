import React, { useEffect, useRef, useState } from "react";
import "./BallBounce.css";

const BOX_W = 440;
const BOX_H = 300;
const BALL_RADIUS = 15;
const PADDLE_W = 86;
const PADDLE_H = 15;
const PADDLE_Y = BOX_H - 40;
const INIT_BALL_SPEED = 3.1;

function getRandomAngle() {
  // between 45-135 or 225-315 degrees, upward direction
  let angle = Math.random() * Math.PI;
  if (Math.random() < 0.5) angle = Math.PI - angle;
  return angle;
}

export default function BallBounce() {
  // Ball: {x, y, dx, dy}
  const [ball, setBall] = useState({
    x: BOX_W / 2,
    y: BOX_H - 60,
    angle: getRandomAngle(),
    speed: INIT_BALL_SPEED
  });
  const [paddleX, setPaddleX] = useState(BOX_W / 2 - PADDLE_W / 2);
  const [bounces, setBounces] = useState(0);
  const [running, setRunning] = useState(true);
  const [gameover, setGameover] = useState(false);

  const rafRef = useRef();
  const boxRef = useRef();

  // Paddle controls: Mouse/Touch
  useEffect(() => {
    function handleTouchMove(e) {
      if (!running) return;
      const rect = boxRef.current.getBoundingClientRect();
      let x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      x = Math.max(0, Math.min(BOX_W - PADDLE_W, x - PADDLE_W / 2));
      setPaddleX(x);
    }
    boxRef.current?.addEventListener("touchmove", handleTouchMove, { passive: false });
    boxRef.current?.addEventListener("mousemove", e => {
      if (e.buttons) handleTouchMove(e);
    });
    return () => {
      boxRef.current?.removeEventListener("touchmove", handleTouchMove);
      boxRef.current?.removeEventListener("mousemove", handleTouchMove);
    };
    // eslint-disable-next-line
  }, [running]);

  // Keyboard
  useEffect(() => {
    function onKey(e) {
      if (!running) return;
      if (e.key === "ArrowLeft") setPaddleX(px => Math.max(0, px - 30));
      if (e.key === "ArrowRight") setPaddleX(px => Math.min(BOX_W - PADDLE_W, px + 30));
      if ((e.key === "r" || e.key === "R") && gameover) restart();
      if ((e.key === " " || e.key === "Enter") && gameover) restart();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, gameover]);

  // Main animation loop
  useEffect(() => {
    if (!running || gameover) return;
    let last = performance.now();
    function frame(now) {
      let dt = Math.min((now - last) / (1000 / 60), 2.1);
      last = now;
      setBall(prev => {
        let { x, y, angle, speed } = prev;
        let dx = Math.cos(angle) * speed;
        let dy = Math.sin(angle) * speed;
        let newX = x + dx * dt;
        let newY = y + dy * dt;
        let bounced = false;

        // Wall collisions
        if (newX - BALL_RADIUS <= 0) {
          newX = BALL_RADIUS;
          angle = Math.PI - angle;
          bounced = true;
        }
        if (newX + BALL_RADIUS >= BOX_W) {
          newX = BOX_W - BALL_RADIUS;
          angle = Math.PI - angle;
          bounced = true;
        }
        if (newY - BALL_RADIUS <= 0) {
          newY = BALL_RADIUS;
          angle = -angle;
          bounced = true;
        }

        // Paddle collision
        if (
          newY + BALL_RADIUS >= PADDLE_Y &&
          newX + BALL_RADIUS > paddleX &&
          newX - BALL_RADIUS < paddleX + PADDLE_W &&
          dy > 0
        ) {
          newY = PADDLE_Y - BALL_RADIUS;
          // Add some "angle" based on hit position
          let relative = ((newX - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2));
          let newAngle = -Math.abs((Math.PI / 2) + (relative * Math.PI / 3));
          angle = newAngle;
          bounced = true;
          speed = Math.min(speed + 0.16, 8); // speed up slightly each time
        }

        // Game over
        if (newY - BALL_RADIUS > BOX_H) {
          setGameover(true);
          setRunning(false);
        }

        if (bounced) setBounces(b => b + 1);

        return { x: newX, y: newY, angle, speed };
      });
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line
  }, [running, paddleX, gameover]);

  function restart() {
    setBall({
      x: BOX_W / 2,
      y: BOX_H - 60,
      angle: getRandomAngle(),
      speed: INIT_BALL_SPEED
    });
    setBounces(0);
    setGameover(false);
    setRunning(true);
  }

  return (
    <div className="ballbounce-container">
      <div className="ballbounce-title">Ball Bounce Game</div>
      <div className="ballbounce-info">
        Bounces: <b>{bounces/2}</b>
        <button className="ballbounce-btn" onClick={restart}>
          {gameover ? "Restart" : "Reset"}
        </button>
      </div>
      <div
        ref={boxRef}
        className="ballbounce-box"
        style={{ width: BOX_W, height: BOX_H }}
        tabIndex={0}
        onBlur={() => setRunning(false)}
        onFocus={() => { if (!gameover) setRunning(true); }}
      >
        <div
          className="ballbounce-ball"
          style={{
            left: ball.x - BALL_RADIUS,
            top: ball.y - BALL_RADIUS,
            width: BALL_RADIUS * 2,
            height: BALL_RADIUS * 2
          }}
        />
        <div
          className="ballbounce-paddle"
          style={{
            left: paddleX,
            top: PADDLE_Y,
            width: PADDLE_W,
            height: PADDLE_H
          }}
        />
        {/* Glowing border */}
        <svg
          className="ballbounce-glow"
          width={BOX_W} height={BOX_H}
          style={{ position: "absolute", left: 0, top: 0, zIndex: 1, pointerEvents: "none" }}
        >
          <rect x={0} y={0} width={BOX_W} height={BOX_H} rx={17} fill="none"
            stroke="#98e6fd" strokeWidth="4.5"
            filter="url(#glowf)" />
          <defs>
            <filter id="glowf" x="-40%" y="-40%" width="180%" height="200%">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
        {gameover && (
          <div className="ballbounce-over">
            <div>
              <b>Game Over</b>
              <br />
              <span>You made {bounces} bounce{bounces !== 1 ? "s" : ""}!</span>
              <br />
              <button className="ballbounce-btn" onClick={restart}>Restart</button>
            </div>
          </div>
        )}
      </div>
      <div className="ballbounce-desc">
        <h3>How to Play</h3>
        <ul>
          <li>Move the paddle with <b>left/right arrows</b> or drag/tap on paddle (mobile & desktop)</li>
          <li>Bounce the ball as many times as you can!</li>
          <li>When the ball falls below the paddle, the game is over. Press <b>Restart</b> to try again.</li>
        </ul>
      </div>
      <div className="ballbounce-footer">
        Ball Bounce – Classic Paddle Game
      </div>
    </div>
  );
}
