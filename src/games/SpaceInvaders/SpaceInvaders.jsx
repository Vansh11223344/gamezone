import React, { useRef, useEffect, useState } from "react";
import "./SpaceInvaders.css";

const GAME_W = 460;
const GAME_H = 520;
const INVADER_ROWS = 5;
const INVADER_COLS = 11;
const PLAYER_W = 44;
const PLAYER_H = 18;
const BULLET_H = 15;

const LEVELS = [
  { name: "Classic", invaderSpeed: 180, bombChance: 0.14, playerLives: 3 },
  { name: "Hard", invaderSpeed: 130, bombChance: 0.20, playerLives: 3 },
  { name: "Nightmare", invaderSpeed: 90, bombChance: 0.30, playerLives: 3 },
];

function createInvaders() {
  let inv = [];
  for (let r = 0; r < INVADER_ROWS; ++r)
    for (let c = 0; c < INVADER_COLS; ++c)
      inv.push({
        x: 50 + c * 32,
        y: 32 + r * 35,
        w: 28,
        h: 24,
        type: r === 0 ? "A" : r < 3 ? "B" : "C",
        alive: true,
      });
  return inv;
}

function randomInt(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

export default function SpaceInvaders() {
  const [level, setLevel] = useState(0);
  const [state, setState] = useState(() => initState(0));
  const [pressed, setPressed] = useState({});
  const [gameOver, setGameOver] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const heldInterval = useRef({});
  const lastFrameTime = useRef(performance.now());
  const animationFrame = useRef();

  function initState(levelIdx) {
    const settings = LEVELS[levelIdx];
    return {
      player: {
        x: GAME_W / 2 - PLAYER_W / 2,
        y: GAME_H - 40,
        w: PLAYER_W,
        h: PLAYER_H,
      },
      pxVel: 0,
      playerBullets: [],
      invaders: createInvaders(),
      bombs: [],
      moveDir: 1,
      moveDrop: false,
      invaderSpeed: settings.invaderSpeed,
      bombChance: settings.bombChance,
      tick: 0,
      frame: 0,
      score: 0,
      lives: settings.playerLives,
      particles: [],
    };
  }

  useEffect(() => {
    setState(initState(level));
  }, [level]);

  useEffect(() => {
    const down = (e) => {
      if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        setPressed((prv) => ({ ...prv, [e.key]: true }));
      }
      if (e.key === "Enter" && !gameStarted) setGameStarted(true);
      if (e.key === "Enter" && gameOver) handleReset();
    };
    const up = (e) => {
      if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        setPressed((prv) => ({ ...prv, [e.key]: false }));
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [gameStarted, gameOver]);

  function beginHold(key) {
    setPressed((pressed) => ({ ...pressed, [key]: true }));
    if (heldInterval.current[key]) clearInterval(heldInterval.current[key]);
    heldInterval.current[key] = setInterval(
      () => setPressed((prv) => ({ ...prv, [key]: true })),
      45
    );
  }
  function endHold(key) {
    setPressed((pressed) => ({ ...pressed, [key]: false }));
    if (heldInterval.current[key]) {
      clearInterval(heldInterval.current[key]);
      heldInterval.current[key] = undefined;
    }
  }
  useEffect(() => () => {
    Object.values(heldInterval.current).forEach((x) => clearInterval(x));
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const update = (now) => {
      const deltaTime = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;
      setState((st) => {
        let s = structuredClone(st);

        if (pressed["ArrowLeft"]) s.pxVel = -5;
        else if (pressed["ArrowRight"]) s.pxVel = 5;
        else s.pxVel = 0;
        s.player.x = Math.max(10, Math.min(GAME_W - PLAYER_W - 10, s.player.x + s.pxVel));

        if (pressed[" "] && s.playerBullets.length < 1) {
          s.playerBullets.push({
            x: s.player.x + PLAYER_W / 2 - 3,
            y: s.player.y - 8,
            vy: -12,
          });
          playSound("shoot");
        }

        s.playerBullets = s.playerBullets
          .map((b) => ({ ...b, y: b.y + b.vy * 110 * deltaTime }))
          .filter((b) => b.y > 0);

        s.bombs = s.bombs
          .map((b) => ({ ...b, y: b.y + b.vy * 60 * deltaTime }))
          .filter((b) => b.y < GAME_H);

        s.particles = s.particles
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 60 * deltaTime,
            y: p.y + p.vy * 60 * deltaTime,
            life: p.life - deltaTime,
          }))
          .filter((p) => p.life > 0);

        for (let b of s.playerBullets) {
          for (let v of s.invaders) {
            if (v.alive && intersect(b, v)) {
              v.alive = false;
              s.score += v.type === "A" ? 40 : v.type === "B" ? 20 : 10;
              b.y = -1000;
              addExplosionParticles(s, v.x + v.w / 2, v.y + v.h / 2);
              playSound("explosion");
            }
          }
        }
        s.playerBullets = s.playerBullets.filter((b) => b.y > -900);

        for (let b of s.bombs) {
          if (intersect(b, s.player)) {
            s.lives--;
            b.y = GAME_H + 100;
            playSound("hit");
          }
        }
        s.bombs = s.bombs.filter((b) => b.y < GAME_H + 10);

        s.frame += deltaTime * 60;
        if (s.frame >= s.invaderSpeed / 15) {
          let minX = Math.min(...s.invaders.filter((v) => v.alive).map((v) => v.x), 1000);
          let maxX = Math.max(...s.invaders.filter((v) => v.alive).map((v) => v.x + v.w), 0);
          let hitEdge = (s.moveDir === 1 && maxX >= GAME_W - 10) || (s.moveDir === -1 && minX <= 10);
          let drop = s.moveDrop;
          for (let v of s.invaders) {
            if (!v.alive) continue;
            if (drop) v.y += 22;
            else v.x += 22 * s.moveDir;
          }
          s.moveDrop = false;
          if (hitEdge) {
            s.moveDir *= -1;
            s.moveDrop = true;
          }
          if (Math.random() > 1.0 - s.bombChance) {
            let columns = {};
            for (let v of s.invaders) {
              if (v.alive) columns[v.x] = v;
            }
            let pool = Object.values(columns);
            if (pool.length) {
              let v = pool[randomInt(0, pool.length - 1)];
              s.bombs.push({ x: v.x + v.w / 2 - 2, y: v.y + v.h, vy: 5 + level * 2 });
              playSound("bomb");
            }
          }
          s.frame = 0;
          s.invaderSpeed = Math.max(18 + 18 * level, s.invaderSpeed - (0.6 + level * 0.4));
        }

        for (let v of s.invaders) {
          if (v.alive && v.y + v.h > s.player.y) s.lives = 0;
        }
        return s;
      });

      animationFrame.current = requestAnimationFrame(update);
    };

    animationFrame.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame.current);
  }, [pressed, gameStarted, gameOver, level]);

  useEffect(() => {
    if (state.lives <= 0) {
      setGameOver("lose");
      playSound("gameover");
    } else if (state.invaders.every((v) => !v.alive)) {
      setGameOver("win");
      playSound("win");
    }
  }, [state]);

  function addExplosionParticles(state, x, y) {
    for (let i = 0; i < 10; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 0.5,
        color: ["#ff666a", "#e1ef42", "#9dfefd"][randomInt(0, 2)],
      });
    }
  }

  function playSound(type) {}

  function handleReset() {
    setState(initState(level));
    setGameOver(null);
    setGameStarted(true);
  }

  function handleStart() {
    setGameStarted(true);
  }

  function handleBtnDown(key) {
    beginHold(key);
  }
  function handleBtnUp(key) {
    endHold(key);
  }

  function handleNextLevel() {
    setLevel((l) => Math.min(l + 1, LEVELS.length - 1));
    setGameOver(null);
    setGameStarted(false);
  }

  // For mobile, allow tap anywhere on overlay to start/restart/next level
  const overlayClick = () => {
    if (!gameStarted) handleStart();
    else if (gameOver && state.invaders.every((v) => !v.alive)) handleNextLevel();
    else if (gameOver) handleReset();
  };

  return (
    <div className="si-outer">
      <h2 className="si-title">Space Invaders</h2>
      <div className="si-level-bar">
        {LEVELS.map((lvl, i) => (
          <span
            key={lvl.name}
            className={`si-level-chip${level === i ? " si-level-active" : ""}`}
            tabIndex={0}
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (level !== i) {
                setLevel(i);
                setGameOver(null);
                setGameStarted(true);
              }
            }}
            onKeyDown={e => {
              if ((e.key === "Enter" || e.key === " ") && level !== i) {
                setLevel(i);
                setGameOver(null);
                setGameStarted(true);
              }
            }}
          >
            {lvl.name}
          </span>
        ))}
      </div>
      <div className="si-scorebar">
        <span>
          Score: <b>{state.score}</b>
        </span>
        <span className="si-lives">
          {Array.from({ length: state.lives }).map((_, i) => (
            <span key={i} className="si-life">
              ▲
            </span>
          ))}
        </span>
      </div>
      <div className="si-board-layout">
        <div className="si-board-wrap">
          <svg className="si-svg" viewBox={`0 0 ${GAME_W} ${GAME_H}`}>
            <rect x={0} y={0} width={GAME_W} height={GAME_H} fill="#040606" />
            {state.invaders.map((v, idx) =>
              v.alive ? (
                <InvaderSprite
                  key={v.x + "," + v.y + v.type + idx}
                  {...v}
                  frame={Math.floor(state.frame / 10) % 2}
                />
              ) : null
            )}
            {state.playerBullets.map((b, i) => (
              <rect
                key={"pb" + i}
                x={b.x}
                y={b.y}
                width={7}
                height={BULLET_H}
                fill="url(#bulletGradient)"
                rx={3}
              />
            ))}
            {state.bombs.map((b, i) => (
              <ellipse
                key={"bomb" + i}
                cx={b.x + 3}
                cy={b.y + 8}
                rx={6}
                ry={6}
                fill="#ff666a"
                opacity="0.56"
                stroke="#fff"
              />
            ))}
            {state.particles.map((p, i) => (
              <circle
                key={"particle" + i}
                cx={p.x}
                cy={p.y}
                r={2}
                fill={p.color}
                opacity={p.life / 0.5}
              />
            ))}
            <rect
              x={state.player.x}
              y={state.player.y}
              width={PLAYER_W}
              height={PLAYER_H}
              fill="url(#playerGradient)"
              rx={8}
              stroke="#7ec7b2"
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="playerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#98f3fe" stopOpacity={1} />
                <stop offset="100%" stopColor="#5bc0de" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="bulletGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e1e896" stopOpacity={1} />
                <stop offset="100%" stopColor="#b7c968" stopOpacity={1} />
              </linearGradient>
            </defs>
          </svg>
          {(!gameStarted || gameOver) && (
              <div
                className={gameOver ? "si-end" : "si-start"}
                onClick={overlayClick}
                tabIndex={-1}
                style={{ touchAction: "manipulation" }}
              >
                <div className="si-end-card">
                  {!gameStarted ? (
                    <>
                      <b>Space Invaders</b>
                      <p>Press Enter or tap to start</p>
                      <button className="si-btn" onClick={handleStart}>
                        Start Game
                      </button>
                    </>
                  ) : gameOver === "win" && level < LEVELS.length - 1 ? (
                    <>
                      <b>🏁 Level {level + 1} Complete!</b>
                      <div className="si-score-msg">
                        Score: <span>{state.score}</span>
                      </div>
                      <button className="si-btn" onClick={handleNextLevel}>
                        Next Level &rarr;
                      </button>
                      <div className="si-level-up-info">
                        Get ready... {LEVELS[level + 1].name}
                      </div>
                    </>
                  ) : (
                    <>
                      <b>
                        {gameOver === "win"
                          ? "👾 All Levels Complete!"
                          : "💀 Game Over"}
                      </b>
                      <div className="si-score-msg">
                        Score: <span>{state.score}</span>
                      </div>
                      <button className="si-btn" onClick={handleReset}>
                        Play Again
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
        </div>
        <div className="si-controls">
          <button
            aria-label="Left"
            onTouchStart={() => handleBtnDown("ArrowLeft")}
            onTouchEnd={() => handleBtnUp("ArrowLeft")}
            onMouseDown={() => handleBtnDown("ArrowLeft")}
            onMouseUp={() => handleBtnUp("ArrowLeft")}
            onMouseLeave={() => handleBtnUp("ArrowLeft")}
            tabIndex={0}
          >
            ←
          </button>
          <button
            aria-label="Shoot"
            className="si-shoot"
            onTouchStart={() => handleBtnDown(" ")}
            onTouchEnd={() => handleBtnUp(" ")}
            onMouseDown={() => handleBtnDown(" ")}
            onMouseUp={() => handleBtnUp(" ")}
            onMouseLeave={() => handleBtnUp(" ")}
            tabIndex={0}
          >
            ▲
          </button>
          <button
            aria-label="Right"
            onTouchStart={() => handleBtnDown("ArrowRight")}
            onTouchEnd={() => handleBtnUp("ArrowRight")}
            onMouseDown={() => handleBtnDown("ArrowRight")}
            onMouseUp={() => handleBtnUp("ArrowRight")}
            onMouseLeave={() => handleBtnUp("ArrowRight")}
            tabIndex={0}
          >
            →
          </button>
        </div>
      </div>
      <div className="si-help">
        <b>How to play:</b> Hold ← → to move, shoot with <kbd>▲</kbd> or spacebar. Tap and hold buttons on mobile.
      </div>
    </div>
  );
}

function InvaderSprite({ x, y, type, frame }) {
  let color, pixels;
  if (type === "A") {
    color = "#e1ef42";
    pixels =
      frame === 0
        ? [
            [2, 0],[3, 0],[6, 0],[7, 0],[1, 1],[2, 1],[3, 1],[6, 1],[7, 1],[8, 1],[0, 3],[9, 3],
            [1, 2],[8, 2],[0, 4],[1, 4],[8, 4],[9, 4],[5, 3],[4, 3],[3, 2],[6, 2],[3, 5],[6, 5],
          ]
        : [
            [2, 0],[3, 0],[6, 0],[7, 0],[1, 1],[2, 1],[3, 1],[6, 1],[7, 1],[8, 1],[0, 3],[9, 3],
            [1, 2],[8, 2],[0, 4],[1, 4],[8, 4],[9, 4],[5, 3],[4, 3],[2, 5],[7, 5],
          ];
  } else if (type === "B") {
    color = "#9dfefd";
    pixels =
      frame === 0
        ? [
            [2, 0],[3, 0],[6, 0],[7, 0],[1, 1],[2, 1],[3, 1],[6, 1],[7, 1],[8, 1],[5, 2],
            [4, 2],[5, 3],[4, 3],[0, 3],[9, 3],[0, 4],[9, 4],[2, 4],[3, 4],[6, 4],[7, 4],[5, 5],[4, 5],
          ]
        : [
            [2, 0],[3, 0],[6, 0],[7, 0],[1, 1],[2, 1],[3, 1],[6, 1],[7, 1],[8, 1],[5, 2],
            [4, 2],[5, 3],[4, 3],[0, 3],[9, 3],[0, 4],[9, 4],[1, 4],[8, 4],[5, 5],[4, 5],
          ];
  } else {
    color = "#f76ea0";
    pixels =
      frame === 0
        ? [
            [1, 0],[8, 0],[2, 1],[3, 1],[6, 1],[7, 1],[1, 2],[8, 2],[2, 3],[3, 3],[6, 3],
            [7, 3],[1, 4],[8, 4],[5, 3],[4, 3],
          ]
        : [
            [1, 0],[8, 0],[2, 1],[3, 1],[6, 1],[7, 1],[1, 2],[8, 2],[2, 3],[3, 3],[6, 3],
            [7, 3],[0, 4],[9, 4],[5, 3],[4, 3],
          ];
  }
  return (
    <g>
      {pixels.map(([dx, dy], i) => (
        <rect
          key={i}
          x={x + dx * 2}
          y={y + dy * 2}
          width={2.5}
          height={2.5}
          fill={color}
          opacity="0.87"
        />
      ))}
    </g>
  );
}

function intersect(a, b) {
  return a.x < b.x + b.w && a.x + 7 > b.x && a.y < b.y + b.h && a.y + BULLET_H > b.y;
}
