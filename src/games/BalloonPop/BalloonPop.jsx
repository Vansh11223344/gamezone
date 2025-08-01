import React, { useRef, useEffect, useState, useCallback } from "react";
import "./BalloonPop.css";

const BALLOON_TYPES = [
  { color: "#ff6b6b", name: "Red", points: 1, rarity: 0.3 },
  { color: "#4ecdc4", name: "Teal", points: 2, rarity: 0.25 },
  { color: "#45b7d1", name: "Blue", points: 1, rarity: 0.3 },
  { color: "#96ceb4", name: "Green", points: 2, rarity: 0.25 },
  { color: "#ffeaa7", name: "Yellow", points: 3, rarity: 0.15 },
  { color: "#dda0dd", name: "Purple", points: 3, rarity: 0.15 },
  { color: "#ff9ff3", name: "Pink", points: 4, rarity: 0.1 },
  { color: "#ffd93d", name: "Gold", points: 5, rarity: 0.05 }
];

const BOARD_W = 400, BOARD_H = 600;
const MAX_MISSES = 10;
const POP_ANIMATION_DURATION = 400;
const COMBO_THRESHOLD = 3;

function weightedRandomBalloon() {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const type of BALLOON_TYPES) {
    cumulative += type.rarity;
    if (rand <= cumulative) return type;
  }
  return BALLOON_TYPES[0];
}

function randBetween(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function makeBalloon() {
  const type = weightedRandomBalloon();
  const size = randBetween(28, 42);
  
  return {
    id: Math.random().toString(36).slice(2),
    ...type,
    x: randBetween(size, BOARD_W - size),
    y: BOARD_H + randBetween(50, 100),
    r: size,
    vy: randBetween(1.5, 3.5) + Math.random() * 2,
    vx: (Math.random() - 0.5) * 0.8,
    pop: false,
    popAnim: false,
    popStart: null,
    opacity: 1,
    rotation: Math.random() * 10 - 5
  };
}

export default function BalloonPop() {
  const [balloons, setBalloons] = useState([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [gameover, setGameover] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [spawnRate, setSpawnRate] = useState(1800);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastPopTime, setLastPopTime] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('balloonPopHighScore') || '0');
  });
  const [particles, setParticles] = useState([]);
  const [scorePopups, setScorePopups] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  
  const animRef = useRef();
  const spawnRef = useRef();
  const comboTimeoutRef = useRef();
  const missedBalloonsRef = useRef(new Set());

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameover(false);
    setBalloons([]);
    setScore(0);
    setMisses(0);
    setCombo(0);
    setMaxCombo(0);
    setSpawnRate(1800);
    setParticles([]);
    setScorePopups([]);
    setIsPaused(false);
    missedBalloonsRef.current.clear();
  }, []);

  const pauseGame = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const createParticles = useCallback((x, y, color, points) => {
    const particleCount = Math.min(20, 8 + points * 2);
    const newParticles = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: Math.random().toString(36).slice(2),
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        color,
        life: 1,
        decay: 0.02 + Math.random() * 0.01
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const createScorePopup = useCallback((x, y, points) => {
    const id = Math.random().toString(36).slice(2);
    setScorePopups(prev => [
      ...prev,
      { id, x, y, points, startTime: Date.now() }
    ]);
  }, []);

  const popBalloon = useCallback((balloon) => {
    if (balloon.popAnim) return;
    
    const now = Date.now();
    const timeSinceLastPop = now - lastPopTime;
    
    let newCombo = timeSinceLastPop < 1000 ? combo + 1 : 1;
    setCombo(newCombo);
    setMaxCombo(prev => Math.max(prev, newCombo));
    setLastPopTime(now);
    
    const basePoints = balloon.points;
    const comboMultiplier = newCombo >= COMBO_THRESHOLD ? Math.min(newCombo, 5) : 1;
    const finalPoints = basePoints * comboMultiplier;
    
    setBalloons(prev => prev.map(b =>
      b.id === balloon.id
        ? { ...b, pop: true, popAnim: true, popStart: now }
        : b
    ));
    
    setScore(s => s + finalPoints);
    createParticles(balloon.x, balloon.y, balloon.color, balloon.points);
    createScorePopup(balloon.x, balloon.y, finalPoints);
  }, [combo, lastPopTime, createParticles, createScorePopup]);

  useEffect(() => {
    if (!gameStarted || gameover || isPaused) return;
    
    spawnRef.current = setInterval(() => {
      setBalloons(prev => {
        if (prev.length < 12) {
          return [...prev, makeBalloon()];
        }
        return prev;
      });
    }, spawnRate);
    
    return () => clearInterval(spawnRef.current);
  }, [gameStarted, gameover, spawnRate, isPaused]);

  useEffect(() => {
    if (!gameStarted || gameover || isPaused) return;
    
    function frame() {
      const now = Date.now();
      
      setBalloons(prev => {
        let missedCount = 0;
        const newBalloons = prev.map(balloon => {
          if (balloon.popAnim) {
            if (!balloon.popStart) {
              return { ...balloon, popStart: now };
            }
            const elapsed = now - balloon.popStart;
            if (elapsed > POP_ANIMATION_DURATION) {
              return null;
            }
            
            const progress = elapsed / POP_ANIMATION_DURATION;
            return { 
              ...balloon, 
              scale: 1 + progress * 0.2,
              opacity: 1 - progress,
              rotation: balloon.rotation + progress * 180
            };
          }
          
          if (!balloon.popAnim && balloon.y < -balloon.r && !missedBalloonsRef.current.has(balloon.id)) {
            missedBalloonsRef.current.add(balloon.id);
            missedCount++;
            return null;
          }
          
          return { 
            ...balloon, 
            y: balloon.y - balloon.vy,
            x: balloon.x + balloon.vx,
            rotation: balloon.rotation + 0.1
          };
        }).filter(balloon => balloon !== null);
        
        if (missedCount > 0) {
          setMisses(m => Math.min(m + missedCount, MAX_MISSES));
          setCombo(0);
        }
        
        return newBalloons;
      });

      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + 0.2,
        life: particle.life - particle.decay
      })).filter(particle => particle.life > 0));

      setScorePopups(prev => prev.filter(popup => 
        now - popup.startTime < 1500
      ));
      
      animRef.current = requestAnimationFrame(frame);
    }
    
    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameStarted, gameover, isPaused]);

  useEffect(() => {
    if (misses >= MAX_MISSES && !gameover) {
      setGameover(true);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('balloonPopHighScore', score.toString());
      }
    }
    
    const newSpawnRate = Math.max(800, 1800 - Math.floor(score / 10) * 100);
    if (newSpawnRate !== spawnRate) {
      setSpawnRate(newSpawnRate);
    }
  }, [misses, score, gameover, highScore, spawnRate]);

  useEffect(() => {
    if (combo > 0) {
      clearTimeout(comboTimeoutRef.current);
      comboTimeoutRef.current = setTimeout(() => setCombo(0), 2000);
    }
    return () => clearTimeout(comboTimeoutRef.current);
  }, [combo]);

  if (!gameStarted) {
    return (
      <div className="bp-container">
        <div className="bp-welcome">
          <h1 className="bp-title">🎈 Balloon Pop Master</h1>
          <div className="bp-instructions">
            <p>Pop balloons before they escape!</p>
            <ul>
              <li>Different colors give different points</li>
              <li>Build combos for bonus multipliers</li>
              <li>Don't let {MAX_MISSES} balloons escape</li>
            </ul>
            <p className="bp-high-score">High Score: <strong>{highScore}</strong></p>
          </div>
          <button className="bp-btn bp-btn-large" onClick={startGame}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bp-container">
      <div className="bp-header">
        <div className="bp-stats">
          <div className="bp-stat">
            <span className="bp-stat-label">Score</span>
            <span className="bp-stat-value">{score}</span>
          </div>
          <div className="bp-stat">
            <span className="bp-stat-label">High Score</span>
            <span className="bp-stat-value">{highScore}</span>
          </div>
          <div className="bp-stat">
            <span className="bp-stat-label">Misses</span>
            <span className={`bp-stat-value ${misses >= MAX_MISSES - 1 ? 'bp-danger' : ''}`}>
              {misses}/{MAX_MISSES}
            </span>
          </div>
        </div>
        <div className="bp-controls">
          <button className="bp-btn bp-btn-small" onClick={pauseGame}>
            {isPaused ? '▶️' : '⏸️'}
          </button>
          <button className="bp-btn bp-btn-small" onClick={startGame}>
            🔄
          </button>
        </div>
      </div>

      {combo >= COMBO_THRESHOLD && (
        <div className="bp-combo">
          <span className="bp-combo-text">COMBO x{Math.min(combo, 5)}</span>
        </div>
      )}

      <div className="bp-board" style={{ width: BOARD_W, height: BOARD_H }}>
        {balloons.map(balloon => (
          <div
            key={balloon.id}
            className={`bp-balloon ${balloon.popAnim ? 'bp-popping' : ''}`}
            style={{
              left: balloon.x - balloon.r,
              top: balloon.y - balloon.r,
              width: balloon.r * 2,
              height: balloon.r * 2,
              backgroundColor: balloon.color,
              transform: `rotate(${balloon.rotation}deg) ${balloon.scale ? `scale(${balloon.scale})` : ''}`,
              opacity: balloon.opacity || 1,
              zIndex: balloon.popAnim ? 1000 : Math.floor(balloon.y),
              pointerEvents: balloon.popAnim ? 'none' : 'auto'
            }}
            onClick={() => popBalloon(balloon)}
          >
            <div className="bp-balloon-highlight"></div>
            <div className="bp-balloon-string"></div>
            {balloon.points > 1 && (
              <div className="bp-balloon-points">+{balloon.points}</div>
            )}
          </div>
        ))}

        {particles.map(particle => (
          <div
            key={particle.id}
            className="bp-particle"
            style={{
              left: particle.x,
              top: particle.y,
              backgroundColor: particle.color,
              opacity: particle.life,
              transform: `scale(${particle.life})`
            }}
          />
        ))}

        {scorePopups.map(popup => (
          <div
            key={popup.id}
            className="bp-score-popup"
            style={{
              left: popup.x,
              top: popup.y,
              fontSize: `${1 + popup.points / 10}rem`
            }}
          >
            +{popup.points}
          </div>
        ))}

        {isPaused && (
          <div className="bp-pause-overlay">
            <div className="bp-pause-content">
              <h2>Game Paused</h2>
              <button className="bp-btn" onClick={pauseGame}>Resume</button>
            </div>
          </div>
        )}

        {gameover && (
          <div className="bp-game-over">
            <div className="bp-game-over-content">
              <h2>Game Over!</h2>
              <div className="bp-final-stats">
                <p>Final Score: <strong>{score}</strong></p>
                {score > highScore && <p className="bp-new-record">🎉 New High Score!</p>}
                <p>Best Combo: <strong>x{maxCombo}</strong></p>
              </div>
              <button className="bp-btn bp-btn-large" onClick={startGame}>
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bp-footer">
        <div className="bp-legend">
          {BALLOON_TYPES.slice(0, 6).map(type => (
            <div key={type.name} className="bp-legend-item">
              <div 
                className="bp-legend-balloon" 
                style={{ backgroundColor: type.color }}
              ></div>
              <span>{type.points}pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}