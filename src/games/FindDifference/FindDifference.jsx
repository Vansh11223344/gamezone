import React, { useState, useEffect, useRef } from 'react';
import "./FindDifference.css";

const FindDifferenceGame = () => {
  const [gameState, setGameState] = useState('welcome'); // welcome, playing, paused, gameOver
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [foundDifferences, setFoundDifferences] = useState([]);
  const [timeLeft, setTimeLeft] = useState(90); // Adjusted time limits
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('fd_high_score');
    return saved ? parseInt(saved) : 0;
  });
  const [showHint, setShowHint] = useState(false);
  const [hintCount, setHintCount] = useState(3);
  const [comboCount, setComboCount] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [clickEffect, setClickEffect] = useState(null);
  
  const timerRef = useRef(null);
  const comboTimeoutRef = useRef(null);
  
  // Updated differences data with 2-3 clear, distinct differences per level
  const levels = {
    1: {
      name: "Garden Paradise",
      differences: [
        { id: 1, x: 150, y: 100, radius: 15, found: false, description: "Missing red flower", type: "flower", color: "#ff6b6b", size: 20, presentIn: "left" },
        { id: 2, x: 300, y: 150, radius: 15, found: false, description: "Blue butterfly vs. yellow", type: "butterfly", colorLeft: "#45b7d1", colorRight: "#ffd700", size: 18 },
        { id: 3, x: 200, y: 200, radius: 15, found: false, description: "Extra green leaf", type: "leaf", color: "#96ceb4", size: 22, presentIn: "right" }
      ],
      timeLimit: 90
    },
    2: {
      name: "Seaside Sunset",
      differences: [
        { id: 1, x: 160, y: 80, radius: 15, found: false, description: "Missing seagull", type: "seagull", color: "#ffffff", size: 20, presentIn: "left" },
        { id: 2, x: 280, y: 140, radius: 15, found: false, description: "Red sailboat vs. blue", type: "sailboat", colorLeft: "#ff6b6b", colorRight: "#2980b9", size: 18 }
      ],
      timeLimit: 80
    },
    3: {
      name: "Mountain Valley",
      differences: [
        { id: 1, x: 170, y: 70, radius: 15, found: false, description: "Missing snow peak", type: "peak", color: "#ffffff", size: 22, presentIn: "left" },
        { id: 2, x: 290, y: 130, radius: 15, found: false, description: "Extra pine tree", type: "tree", color: "#2ecc71", size: 20, presentIn: "right" },
        { id: 3, x: 200, y: 180, radius: 15, found: false, description: "River path shape change", type: "river", colorLeft: "#4ecdc4", colorRight: "#3498db", size: 18 }
      ],
      timeLimit: 70
    }
  };

  const currentLevelData = levels[currentLevel] || levels[1];
  const totalDifferences = currentLevelData.differences.length;
  const remainingDifferences = totalDifferences - foundDifferences.length;

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleGameOver();
    }
    return () => clearTimeout(timerRef.current);
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (foundDifferences.length === totalDifferences && gameState === 'playing') {
      handleLevelComplete();
    }
  }, [foundDifferences]);

  useEffect(() => {
    if (comboCount >= 2) {
      setShowCombo(true);
      setTimeout(() => setShowCombo(false), 1500);
    }
  }, [comboCount]);

  const startGame = () => {
    setGameState('playing');
    setCurrentLevel(1);
    setScore(0);
    setFoundDifferences([]);
    setTimeLeft(levels[1].timeLimit);
    setLives(3);
    setHintCount(3);
    setComboCount(0);
    setAchievements([]);
  };

  const pauseGame = () => {
    setGameState('paused');
  };

  const resumeGame = () => {
    setGameState('playing');
  };

  const handleImageClick = (e, imageType) => {
    if (gameState !== 'playing') return;

    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Scale coordinates based on actual image size vs display size
    const scaleX = 400 / rect.width;
    const scaleY = 300 / rect.height;
    const actualX = clickX * scaleX;
    const actualY = clickY * scaleY;

    // Check if click is near any unfound difference
    const clickedDifference = currentLevelData.differences.find(diff => {
      if (foundDifferences.includes(diff.id)) return false;
      const distance = Math.sqrt(Math.pow(actualX - diff.x, 2) + Math.pow(actualY - diff.y, 2));
      return distance <= diff.radius;
    });

    setClickEffect({ x: clickX, y: clickY, type: clickedDifference ? 'correct' : 'wrong' });
    setTimeout(() => setClickEffect(null), 800);

    if (clickedDifference) {
      // Correct click
      const newFound = [...foundDifferences, clickedDifference.id];
      setFoundDifferences(newFound);
      
      const points = 100 + (comboCount * 50);
      setScore(prev => prev + points);
      
      // Combo system
      clearTimeout(comboTimeoutRef.current);
      setComboCount(prev => prev + 1);
      comboTimeoutRef.current = setTimeout(() => setComboCount(0), 3000);

      // Show score popup
      showScorePopup(e.clientX, e.clientY, points);

      // Check for achievements
      checkAchievements(newFound.length, comboCount + 1);
    } else {
      // Wrong click - lose life
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          handleGameOver();
        }
        return newLives;
      });
      setComboCount(0);
    }
  };

  const showScorePopup = (x, y, points) => {
    const popup = document.createElement('div');
    popup.className = 'fd-score-popup';
    popup.textContent = `+${points}`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    document.body.appendChild(popup);
    setTimeout(() => document.body.removeChild(popup), 1500);
  };

  const useHint = () => {
    if (hintCount <= 0 || gameState !== 'playing') return;
    
    const unfoundDiffs = currentLevelData.differences.filter(diff => 
      !foundDifferences.includes(diff.id)
    );
    
    if (unfoundDiffs.length > 0) {
      setHintCount(prev => prev - 1);
      setShowHint(true);
      setTimeout(() => setShowHint(false), 3000);
    }
  };

  const handleLevelComplete = () => {
    const timeBonus = timeLeft * 10;
    const lifeBonus = lives * 200;
    const totalBonus = timeBonus + lifeBonus;
    
    setScore(prev => prev + totalBonus);
    
    if (currentLevel < Object.keys(levels).length) {
      // Next level
      setTimeout(() => {
        setCurrentLevel(prev => prev + 1);
        setFoundDifferences([]);
        setTimeLeft(levels[currentLevel + 1]?.timeLimit || 70);
        setHintCount(prev => prev + 1); // Bonus hint for completing level
        showAchievement(`Level ${currentLevel} Complete!`);
      }, 2000);
    } else {
      // Game complete
      setTimeout(() => {
        handleGameComplete();
      }, 2000);
    }
  };

  const handleGameComplete = () => {
    setGameState('gameOver');
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('fd_high_score', score.toString());
      showAchievement('New High Score!');
    }
  };

  const handleGameOver = () => {
    setGameState('gameOver');
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('fd_high_score', score.toString());
    }
  };

  const checkAchievements = (foundCount, combo) => {
    if (combo === 2 && !achievements.includes('Double Combo')) {
      showAchievement('Double Combo!');
      setAchievements(prev => [...prev, 'Double Combo']);
    }
    if (foundCount === totalDifferences && !achievements.includes('Level Master')) {
      showAchievement('Level Master!');
      setAchievements(prev => [...prev, 'Level Master']);
    }
    if (timeLeft > currentLevelData.timeLimit * 0.8 && foundCount === totalDifferences && !achievements.includes('Speed Demon')) {
      showAchievement('Speed Demon!');
      setAchievements(prev => [...prev, 'Speed Demon']);
    }
  };

  const showAchievement = (text) => {
    const achievement = document.createElement('div');
    achievement.className = 'fd-achievement';
    achievement.textContent = text;
    document.body.appendChild(achievement);
    setTimeout(() => document.body.removeChild(achievement), 3000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateImagePattern = (imageType) => {
    const patterns = [];
    const differences = currentLevelData.differences;

    // Generate background elements (e.g., clouds, trees) for context
    for (let i = 0; i < 10; i++) {
      patterns.push(
        <div
          key={`bg-${i}`}
          className={`fd-pattern-element fd-pattern-background`}
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
            width: `${30 + Math.random() * 20}px`,
            height: `${30 + Math.random() * 20}px`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      );
    }

    // Render differences based on imageType (left or right)
    differences.forEach(diff => {
      const shouldRender =
        (imageType === 'left' && diff.presentIn !== 'right') ||
        (imageType === 'right' && diff.presentIn !== 'left') ||
        (imageType === 'left' && diff.colorLeft) ||
        (imageType === 'right' && diff.colorRight);
      
      if (shouldRender) {
        const color = imageType === 'left' ? (diff.colorLeft || diff.color) : (diff.colorRight || diff.color);
        patterns.push(
          <svg
            key={diff.id}
            className={`fd-pattern-element fd-pattern-${diff.type}`}
            style={{
              left: `${(diff.x / 400) * 100}%`,
              top: `${(diff.y / 300) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: `${diff.size}px`,
              height: `${diff.size}px`
            }}
          >
            {diff.type === 'flower' && (
              <path d="M10,0 A10,10 0 0,1 20,10 A10,10 0 0,1 10,20 A10,10 0 0,1 0,10 A10,10 0 0,1 10,0 M10,5 A5,5 0 0,0 5,10 A5,5 0 0,0 10,15 A5,5 0 0,0 15,10 A5,5 0 0,0 10,5" fill={color} />
            )}
            {diff.type === 'butterfly' && (
              <path d="M0,10 L5,5 L10,10 L5,15 Z M10,10 L15,5 L20,10 L15,15 Z" fill={color} />
            )}
            {diff.type === 'leaf' && (
              <path d="M0,10 Q5,0 10,10 Q15,20 20,10 Q15,0 10,10 Q5,20 0,10" fill={color} />
            )}
            {diff.type === 'seagull' && (
              <path d="M0,10 L5,5 L10,10 L15,5 L20,10 L15,15 L10,10 L5,15 Z" fill={color} />
            )}
            {diff.type === 'sailboat' && (
              <path d="M5,15 L15,15 L10,5 Z M8,15 L12,15 L12,20 L8,20 Z" fill={color} />
            )}
            {diff.type === 'peak' && (
              <path d="M0,15 L10,5 L20,15 Z" fill={color} />
            )}
            {diff.type === 'tree' && (
              <path d="M5,15 L15,15 L10,5 Z M7,15 L13,15 L13,20 L7,20 Z" fill={color} />
            )}
            {diff.type === 'river' && (
              <path d="M0,10 Q5,5 10,10 Q15,15 20,10" fill={color} />
            )}
          </svg>
        );
      }
    });

    return patterns;
  };

  if (gameState === 'welcome') {
    return (
      <div className="fd-container">
        <div className="fd-welcome">
          <h1 className="fd-title">Find the Difference</h1>
          <div className="fd-instructions">
            <h3>How to Play:</h3>
            <ul>
              <li>Find {totalDifferences} differences between the two images</li>
              <li>Click on the differences to mark them</li>
              <li>You have {levels[1].timeLimit} seconds for Level 1</li>
              <li>3 wrong clicks and you lose a life</li>
              <li>Use hints wisely - you start with 3</li>
            </ul>
            <div className="fd-high-score">
              Best Score: {highScore.toLocaleString()}
            </div>
          </div>
          <button className="fd-btn fd-btn-large" onClick={startGame}>
            🔍 Start Finding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fd-container">
      {/* Header Stats */}
      <div className="fd-header">
        <div className="fd-stats">
          <div className="fd-stat">
            <div className="fd-stat-label">Level</div>
            <div className="fd-stat-value">{currentLevel}</div>
          </div>
          <div className="fd-stat">
            <div className="fd-stat-label">Score</div>
            <div className="fd-stat-value">{score.toLocaleString()}</div>
          </div>
          <div className="fd-stat">
            <div className="fd-stat-label">Time</div>
            <div className={`fd-stat-value ${timeLeft <= 20 ? 'fd-danger' : ''}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          <div className="fd-stat">
            <div className="fd-stat-label">Lives</div>
            <div className={`fd-stat-value ${lives <= 1 ? 'fd-danger' : ''}`}>
              {'❤️'.repeat(lives)}
            </div>
          </div>
        </div>
        <div className="fd-controls">
          <button className="fd-btn fd-btn-small" onClick={useHint} disabled={hintCount <= 0}>
            💡 {hintCount}
          </button>
          <button className="fd-btn fd-btn-small" onClick={pauseGame}>
            ⏸️
          </button>
        </div>
      </div>

      {/* Combo Indicator */}
      {showCombo && comboCount >= 2 && (
        <div className="fd-combo">
          <div className="fd-combo-text">
            {comboCount}x Combo! 🔥
          </div>
        </div>
      )}

      {/* Level Title */}
      <div className="fd-level-title">
        <h2>{currentLevelData.name}</h2>
        <div className="fd-progress">
          Found: {foundDifferences.length}/{totalDifferences}
        </div>
      </div>

      {/* Game Images */}
      <div className="fd-images-container">
        <div className="fd-image-wrapper">
          <div className="fd-image-label">Original</div>
          <div 
            className={`fd-image fd-image-left fd-level-${currentLevel}`}
            onClick={(e) => handleImageClick(e, 'left')}
          >
            {generateImagePattern('left')}
            {/* Show found differences */}
            {currentLevelData.differences.map(diff => 
              foundDifferences.includes(diff.id) && (
                <div
                  key={diff.id}
                  className="fd-difference-marker fd-found"
                  style={{
                    left: `${(diff.x / 400) * 100}%`,
                    top: `${(diff.y / 300) * 100}%`
                  }}
                >
                  ✓
                </div>
              )
            )}
            {/* Show hint */}
            {showHint && currentLevelData.differences.find(d => !foundDifferences.includes(d.id)) && (
              <div
                className="fd-hint-marker"
                style={{
                  left: `${(currentLevelData.differences.find(d => !foundDifferences.includes(d.id)).x / 400) * 100}%`,
                  top: `${(currentLevelData.differences.find(d => !foundDifferences.includes(d.id)).y / 300) * 100}%`
                }}
              >
                💡
              </div>
            )}
            {/* Click effects */}
            {clickEffect && clickEffect.type && (
              <div
                className={`fd-click-effect fd-click-${clickEffect.type}`}
                style={{
                  left: clickEffect.x,
                  top: clickEffect.y
                }}
              >
                {clickEffect.type === 'correct' ? '✓' : '✗'}
              </div>
            )}
          </div>
        </div>

        <div className="fd-image-wrapper">
          <div className="fd-image-label">Find the Differences</div>
          <div 
            className={`fd-image fd-image-right fd-level-${currentLevel}`}
            onClick={(e) => handleImageClick(e, 'right')}
          >
            {generateImagePattern('right')}
            {/* Show found differences */}
            {currentLevelData.differences.map(diff => 
              foundDifferences.includes(diff.id) && (
                <div
                  key={diff.id}
                  className="fd-difference-marker fd-found"
                  style={{
                    left: `${(diff.x / 400) * 100}%`,
                    top: `${(diff.y / 300) * 100}%`
                  }}
                >
                  ✓
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Pause Overlay */}
      {gameState === 'paused' && (
        <div className="fd-pause-overlay">
          <div className="fd-pause-content">
            <h2>Game Paused</h2>
            <button className="fd-btn" onClick={resumeGame}>
              ▶️ Resume
            </button>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === 'gameOver' && (
        <div className="fd-game-over">
          <div className="fd-game-over-content">
            <h2>{currentLevel > Object.keys(levels).length ? '🎉 Congratulations!' : '💔 Game Over'}</h2>
            <div className="fd-final-stats">
              <p>Final Score: <strong>{score.toLocaleString()}</strong></p>
              <p>Level Reached: <strong>{currentLevel}</strong></p>
              <p>Differences Found: <strong>{foundDifferences.length}</strong></p>
              {score > highScore && (
                <p className="fd-new-record">🏆 New High Score!</p>
              )}
            </div>
            <button className="fd-btn fd-btn-large" onClick={() => setGameState('welcome')}>
              🏠 Main Menu
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fd-footer">
        <div className="fd-tips">
          <h4>💡 Pro Tips:</h4>
          <p>• Look for missing objects, color changes, or shape differences</p>
          <p>• Click precisely to avoid losing lives</p>
          <p>• Use hints to reveal tough differences</p>
        </div>
      </div>
    </div>
  );
};

export default FindDifferenceGame;