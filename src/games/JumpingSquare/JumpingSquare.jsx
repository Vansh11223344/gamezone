import React, { useRef, useEffect, useState } from "react";
import "./JumpingSquare.css";

const GAME_W = 500, GAME_H = 220;
const GROUND_Y = GAME_H - 44;
const SQUARE_SIZE = 36;
const OBSTACLE_W = 25, OBSTACLE_H = 44;
const GRAVITY = 0.92;
const JUMP = -19.5;
const SPEED = 4.2;
const MIN_OBSTACLE_GAP = 300; // Minimum gap between obstacles

function getRandomObstacle(x) {
  const heightVariation = Math.random() * 50;
  const obstacleHeight = OBSTACLE_H + heightVariation;
  return {
    x,
    y: GROUND_Y - obstacleHeight + 4,
    w: OBSTACLE_W + Math.random() * 10,
    h: obstacleHeight
  };
}

export default function JumpingSquare() {
  const [running, setRunning] = useState(true);
  const [player, setPlayer] = useState({ y: GROUND_Y - SQUARE_SIZE, vy: 0 });
  const [obstacles, setObstacles] = useState([getRandomObstacle(GAME_W + 70)]);
  const [score, setScore] = useState(0);
  const [lost, setLost] = useState(false);

  const gameRef = useRef(null);
  const raf = useRef();

  function jump() {
    if (!running) return;
    setPlayer(p => {
      if (p.y >= GROUND_Y - SQUARE_SIZE - 1) {
        return { ...p, vy: JUMP };
      }
      return p;
    });
  }

  function restart() {
    if (raf.current) cancelAnimationFrame(raf.current);
    setPlayer({ y: GROUND_Y - SQUARE_SIZE, vy: 0 });
    setObstacles([getRandomObstacle(GAME_W + 70)]);
    setScore(0);
    setRunning(true);
    setLost(false);
  }

  useEffect(() => {
    function handle(e) {
      if ([" ", "Spacebar", "ArrowUp", "w", "W"].includes(e.key)) {
        jump();
        e.preventDefault();
      }
      if (!running && [" ", "Enter", "r", "R"].includes(e.key)) {
        restart();
      }
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [running]);

  function handleCanvasClick() {
    if (!running) restart();
    else jump();
  }

  useEffect(() => {
    if (!running) return;
    function loop() {
      setPlayer(prev => {
        let vy = prev.vy + GRAVITY;
        let ny = prev.y + vy;
        if (ny > GROUND_Y - SQUARE_SIZE) {
          ny = GROUND_Y - SQUARE_SIZE;
          vy = 0;
        }
        return { y: ny, vy };
      });

      setObstacles(obs => {
        let next = obs
          .map(o => ({ ...o, x: o.x - SPEED }))
          .filter(o => o.x + o.w > -10);
        const lastObstacle = next[next.length - 1];
        if (
          next.length < 2 &&
          lastObstacle &&
          lastObstacle.x < GAME_W - MIN_OBSTACLE_GAP
        ) {
          next.push(getRandomObstacle(GAME_W + 140 + Math.random() * 240));
        }
        return next;
      });

      setScore(scr => scr + 1);
      raf.current = requestAnimationFrame(loop);
    }
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    for (let o of obstacles) {
      if (
        o.x < 62 + SQUARE_SIZE &&
        o.x + o.w > 62 &&
        player.y + SQUARE_SIZE > o.y &&
        player.y < o.y + o.h
      ) {
        setRunning(false);
        setLost(true);
        if (raf.current) cancelAnimationFrame(raf.current);
        break;
      }
    }
  }, [player, obstacles, running]);

  useEffect(() => {
    if (gameRef.current) gameRef.current.focus();
  }, []);

  const scale = Math.min(1, window.innerWidth / (GAME_W + 16));

  return (
    <div className="jsq-container">
      <h1 className="jsq-title">Jumping Square</h1>
      <div className="jsq-score-bar">
        <span>Score: <b>{Math.floor(score / 3)}</b></span>
        <button className="jsq-btn jsq-restart-btn" onClick={restart}>Restart</button>
      </div>
      <div
        className="jsq-canvas-wrap"
        tabIndex={0}
        ref={gameRef}
        style={{
          width: GAME_W * scale,
          height: GAME_H * scale,
          outline: "none"
        }}
        onClick={handleCanvasClick}
        role="region"
        aria-label="Jumping Square game area"
      >
        <svg
          width={GAME_W}
          height={GAME_H}
          viewBox={`0 0 ${GAME_W} ${GAME_H}`}
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <filter id="obshad">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f6c" />
              <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#ff476c" />
            </filter>
            <filter id="playershad">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#38fa" />
              <feDropShadow dx="0" dy="4" stdDeviation="12" floodColor="#17ffe2" />
            </filter>
          </defs>
          <rect className="jsq-background" width={GAME_W} height={GAME_H} />
          <rect className="jsq-ground" y={GROUND_Y + 2} width={GAME_W} height={16} />
          <rect className="jsq-ground-line" y={GROUND_Y} width={GAME_W} height={4} rx={3} />
          {obstacles.map((o, i) => (
            <rect
              key={i}
              x={o.x}
              y={o.y}
              width={o.w}
              height={o.h}
              rx={7}
              className="jsq-obstacle"
              style={{ filter: "url(#obshad)" }}
            />
          ))}
          <rect
            x={62}
            y={player.y}
            width={SQUARE_SIZE}
            height={SQUARE_SIZE}
            rx={8}
            className="jsq-player"
            style={{ filter: "url(#playershad)" }}
          />
        </svg>
        {lost && (
          <div className="jsq-overlay">
            <div className="jsq-overbox">
              <div className="jsq-game-over-text">💀 Game Over!</div>
              <div className="jsq-final-score">Score: <b>{Math.floor(score / 3)}</b></div>
              <button className="jsq-btn" onClick={restart}>
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="jsq-instructions">
        Tap, click, or press <b>Space</b> to jump. Jump the neon square<br />
        over every obstacle to score.<br />
        Try for a high score!
      </div>
      <div className="jsq-footer">
        Classic Jump Game 
      </div>
    </div>
  );
}