import React, { useState, useEffect, useRef, useCallback } from 'react';
import "./FindDifference.css";

const FindDifferenceGame = () => {
  const [gameState, setGameState] = useState('welcome');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [foundDifferences, setFoundDifferences] = useState([]);
  const [timeLeft, setTimeLeft] = useState(90);
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
  const [clickEffects, setClickEffects] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  
  const timerRef = useRef(null);
  const comboTimeoutRef = useRef(null);
  const effectIdRef = useRef(0);

  const levels = {
    1: {
      name: "Enchanted Garden",
      background: "garden",
      differences: [
        { 
          id: 1, 
          x: 120, 
          y: 80, 
          radius: 20, 
          found: false, 
          description: "Missing red flower", 
          type: "flower", 
          color: "#ff6b6b", 
          size: 24, 
          presentIn: "left" 
        },
        { 
          id: 2, 
          x: 280, 
          y: 140, 
          radius: 20, 
          found: false, 
          description: "Butterfly color change", 
          type: "butterfly", 
          colorLeft: "#4ecdc4", 
          colorRight: "#ffd700", 
          size: 20 
        },
        { 
          id: 3, 
          x: 200, 
          y: 200, 
          radius: 20, 
          found: false, 
          description: "Extra leaf", 
          type: "leaf", 
          color: "#2ecc71", 
          size: 22, 
          presentIn: "right" 
        }
      ],
      timeLimit: 90
    },
    2: {
      name: "Ocean Sunset",
      background: "ocean",
      differences: [
        { 
          id: 1, 
          x: 150, 
          y: 70, 
          radius: 20, 
          found: false, 
          description: "Missing seagull", 
          type: "seagull", 
          color: "#ffffff", 
          size: 18, 
          presentIn: "left" 
        },
        { 
          id: 2, 
          x: 290, 
          y: 160, 
          radius: 20, 
          found: false, 
          description: "Sailboat color", 
          type: "sailboat", 
          colorLeft: "#ff6b6b", 
          colorRight: "#3498db", 
          size: 22 
        },
        { 
          id: 3, 
          x: 180, 
          y: 220, 
          radius: 20, 
          found: false, 
          description: "Extra wave", 
          type: "wave", 
          color: "#4ecdc4", 
          size: 24, 
          presentIn: "right" 
        }
      ],
      timeLimit: 80
    },
    3: {
      name: "Mountain Valley",
      background: "mountain",
      differences: [
        { 
          id: 1, 
          x: 140, 
          y: 60, 
          radius: 20, 
          found: false, 
          description: "Snow cap missing", 
          type: "peak", 
          color: "#ffffff", 
          size: 26, 
          presentIn: "left" 
        },
        { 
          id: 2, 
          x: 270, 
          y: 180, 
          radius: 20, 
          found: false, 
          description: "Tree count difference", 
          type: "tree", 
          color: "#2ecc71", 
          size: 20, 
          presentIn: "right" 
        }
      ],
      timeLimit: 70
    }
  };

  const currentLevelData = levels[currentLevel] || levels[1];
  const totalDifferences = currentLevelData.differences.length;

  const addClickEffect = useCallback((x, y, type) => {
    const effectId = effectIdRef.current++;
    const newEffect = { x, y, type, id: effectId };
    
    setClickEffects(prev => [...prev, newEffect]);
    
    setTimeout(() => {
      setClickEffects(prev => prev.filter(effect => effect.id !== effectId));
    }, 1000);
  }, []);

  const showScorePopup = useCallback((x, y, points) => {
    const popup = document.createElement('div');
    popup.className = 'fd-score-popup';
    popup.textContent = `+${points}`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.position = 'fixed';
    popup.style.zIndex = '9999';
    popup.style.pointerEvents = 'none';
    document.body.appendChild(popup);
    
    setTimeout(() => {
      if (document.body.contains(popup)) {
        document.body.removeChild(popup);
      }
    }, 1500);
  }, []);

  const showAchievement = useCallback((text) => {
    const achievement = document.createElement('div');
    achievement.className = 'fd-achievement-popup';
    achievement.textContent = text;
    document.body.appendChild(achievement);
    
    setTimeout(() => {
      if (document.body.contains(achievement)) {
        document.body.removeChild(achievement);
      }
    }, 3000);
  }, []);

  const checkAchievements = useCallback((foundCount, combo) => {
    if (combo >= 3 && !achievements.includes('Triple Combo')) {
      showAchievement('🔥 Triple Combo!');
      setAchievements(prev => [...prev, 'Triple Combo']);
    }
    if (foundCount === totalDifferences && timeLeft > currentLevelData.timeLimit * 0.8 && !achievements.includes('Speed Master')) {
      showAchievement('⚡ Speed Master!');
      setAchievements(prev => [...prev, 'Speed Master']);
    }
  }, [achievements, totalDifferences, timeLeft, currentLevelData.timeLimit, showAchievement]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setCurrentLevel(1);
    setScore(0);
    setFoundDifferences([]);
    setTimeLeft(levels[1].timeLimit);
    setLives(3);
    setHintCount(3);
    setComboCount(0);
    setAchievements([]);
    setIsComplete(false);
    setClickEffects([]);
  }, []);

  const pauseGame = useCallback(() => setGameState('paused'), []);
  const resumeGame = useCallback(() => setGameState('playing'), []);

  const handleImageClick = useCallback((e, imageType) => {
    if (gameState !== 'playing') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = 400 / rect.width;
    const scaleY = 300 / rect.height;
    const actualX = clickX * scaleX;
    const actualY = clickY * scaleY;

    const clickedDifference = currentLevelData.differences.find(diff => {
      if (foundDifferences.includes(diff.id)) return false;
      const distance = Math.sqrt(Math.pow(actualX - diff.x, 2) + Math.pow(actualY - diff.y, 2));
      return distance <= diff.radius;
    });

    addClickEffect(e.clientX, e.clientY, clickedDifference ? 'correct' : 'wrong');

    if (clickedDifference) {
      const newFound = [...foundDifferences, clickedDifference.id];
      setFoundDifferences(newFound);
      
      const basePoints = 100;
      const comboBonus = comboCount * 50;
      const points = basePoints + comboBonus;
      setScore(prev => prev + points);
      
      if (comboTimeoutRef.current) {
        clearTimeout(comboTimeoutRef.current);
      }
      const newCombo = comboCount + 1;
      setComboCount(newCombo);
      comboTimeoutRef.current = setTimeout(() => setComboCount(0), 3000);

      showScorePopup(e.clientX, e.clientY, points);
      checkAchievements(newFound.length, newCombo);

      if (newFound.length === totalDifferences) {
        setIsComplete(true);
      }
    } else {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameState('gameOver');
        }
        return newLives;
      });
      setComboCount(0);
    }
  }, [gameState, currentLevelData.differences, foundDifferences, comboCount, addClickEffect, showScorePopup, checkAchievements, totalDifferences]);

  const useHint = useCallback(() => {
    if (hintCount <= 0 || gameState !== 'playing') return;
    
    const unfoundDiffs = currentLevelData.differences.filter(diff => 
      !foundDifferences.includes(diff.id)
    );
    
    if (unfoundDiffs.length > 0) {
      setHintCount(prev => prev - 1);
      setShowHint(true);
      setTimeout(() => setShowHint(false), 3000);
    }
  }, [hintCount, gameState, currentLevelData.differences, foundDifferences]);

  const handleLevelComplete = useCallback(() => {
    const timeBonus = timeLeft * 10;
    const lifeBonus = lives * 200;
    const totalBonus = timeBonus + lifeBonus;
    
    setScore(prev => prev + totalBonus);
    
    if (currentLevel < Object.keys(levels).length) {
      setTimeout(() => {
        setCurrentLevel(prev => prev + 1);
        setFoundDifferences([]);
        setTimeLeft(levels[currentLevel + 1]?.timeLimit || 70);
        setHintCount(prev => prev + 1);
        setIsComplete(false);
        showAchievement(`🎉 Level ${currentLevel} Complete!`);
      }, 2000);
    } else {
      setTimeout(() => {
        setGameState('gameOver');
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('fd_high_score', score.toString());
          showAchievement('🏆 New High Score!');
        }
      }, 2000);
    }
  }, [timeLeft, lives, currentLevel, score, highScore, showAchievement]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('gameOver');
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState, timeLeft]);

  // Level completion effect
  useEffect(() => {
    if (isComplete && gameState === 'playing') {
      handleLevelComplete();
    }
  }, [isComplete, gameState, handleLevelComplete]);

  // Combo display effect
  useEffect(() => {
    if (comboCount >= 2) {
      setShowCombo(true);
      setTimeout(() => setShowCombo(false), 1500);
    }
  }, [comboCount]);

  // Game over effect
  useEffect(() => {
    if (gameState === 'gameOver' && score > highScore) {
      setHighScore(score);
      localStorage.setItem('fd_high_score', score.toString());
    }
  }, [gameState, score, highScore]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateImagePattern = (imageType) => {
    const patterns = [];
    const differences = currentLevelData.differences;

    // Background decorative elements
    for (let i = 0; i < 8; i++) {
      patterns.push(
        <div
          key={`bg-${i}`}
          className={`fd-bg-element fd-bg-${currentLevelData.background}`}
          style={{
            left: `${10 + (i % 4) * 25}%`,
            top: `${20 + Math.floor(i / 4) * 40}%`,
            animationDelay: `${i * 0.5}s`
          }}
        />
      );
    }

    // Render differences
    differences.forEach(diff => {
      const shouldRender =
        (imageType === 'left' && diff.presentIn !== 'right') ||
        (imageType === 'right' && diff.presentIn !== 'left') ||
        (imageType === 'left' && diff.colorLeft) ||
        (imageType === 'right' && diff.colorRight);
      
      if (shouldRender) {
        const color = imageType === 'left' ? (diff.colorLeft || diff.color) : (diff.colorRight || diff.color);
        patterns.push(
          <div
            key={`diff-${diff.id}`}
            className={`fd-difference-element fd-${diff.type}`}
            style={{
              left: `${(diff.x / 400) * 100}%`,
              top: `${(diff.y / 300) * 100}%`,
              width: `${diff.size || 20}px`,
              height: `${diff.size || 20}px`,
              backgroundColor: color,
              transform: 'translate(-50%, -50%)'
            }}
          />
        );
      }
    });

    return patterns;
  };

  if (gameState === 'welcome') {
    return (
      <div className="fd-container">
        <div className="fd-welcome-screen">
          <div className="fd-welcome-header">
            <h1 className="fd-main-title">Find the Difference</h1>
            <p className="fd-subtitle">Challenge Your Eagle Eyes!</p>
          </div>
          
          <div className="fd-game-preview">
            <div className="fd-preview-images">
              <div className="fd-preview-image fd-preview-left">
                <div className="fd-preview-label">Original</div>
              </div>
              <div className="fd-preview-vs">VS</div>
              <div className="fd-preview-image fd-preview-right">
                <div className="fd-preview-label">Spot the Differences</div>
              </div>
            </div>
          </div>

          <div className="fd-instructions-card">
            <h3>🎯 How to Play</h3>
            <div className="fd-instruction-list">
              <div className="fd-instruction-item">
                <span className="fd-instruction-icon">👀</span>
                <span>Find all differences between two images</span>
              </div>
              <div className="fd-instruction-item">
                <span className="fd-instruction-icon">👆</span>
                <span>Tap or click on differences to mark them</span>
              </div>
              <div className="fd-instruction-item">
                <span className="fd-instruction-icon">⏱️</span>
                <span>Complete each level within the time limit</span>
              </div>
              <div className="fd-instruction-item">
                <span className="fd-instruction-icon">❤️</span>
                <span>You have 3 lives - wrong clicks cost a life</span>
              </div>
              <div className="fd-instruction-item">
                <span className="fd-instruction-icon">💡</span>
                <span>Use hints wisely when you're stuck</span>
              </div>
            </div>
          </div>

          <div className="fd-stats-card">
            <div className="fd-stat-item">
              <div className="fd-stat-label">High Score</div>
              <div className="fd-stat-value">{highScore.toLocaleString()}</div>
            </div>
            <div className="fd-stat-item">
              <div className="fd-stat-label">Levels</div>
              <div className="fd-stat-value">{Object.keys(levels).length}</div>
            </div>
          </div>

          <button className="fd-start-button" onClick={startGame}>
            <span className="fd-button-icon">🔍</span>
            <span>Start Adventure</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fd-container">
      {/* Header */}
      <div className="fd-game-header">
        <div className="fd-level-info">
          <h2 className="fd-level-title">{currentLevelData.name}</h2>
          <div className="fd-level-progress">
            Level {currentLevel} • {foundDifferences.length}/{totalDifferences} Found
          </div>
        </div>
        
        <div className="fd-game-stats">
          <div className="fd-stat-group">
            <div className="fd-stat-box">
              <div className="fd-stat-label">Score</div>
              <div className="fd-stat-value">{score.toLocaleString()}</div>
            </div>
            <div className="fd-stat-box">
              <div className="fd-stat-label">Time</div>
              <div className={`fd-stat-value ${timeLeft <= 20 ? 'fd-danger' : ''}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
            <div className="fd-stat-box">
              <div className="fd-stat-label">Lives</div>
              <div className={`fd-stat-value ${lives <= 1 ? 'fd-danger' : ''}`}>
                {Array.from({ length: 3 }, (_, i) => (
                  <span key={i} className={`fd-heart ${i < lives ? 'fd-heart-full' : 'fd-heart-empty'}`}>
                    ❤️
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="fd-action-buttons">
            <button 
              className="fd-hint-button" 
              onClick={useHint} 
              disabled={hintCount <= 0}
              title={`${hintCount} hints remaining`}
            >
              💡 {hintCount}
            </button>
            <button className="fd-pause-button" onClick={pauseGame}>
              ⏸️
            </button>
          </div>
        </div>
      </div>

      {/* Combo Display */}
      {showCombo && comboCount >= 2 && (
        <div className="fd-combo-display">
          <div className="fd-combo-text">
            {comboCount}x COMBO! 🔥
          </div>
        </div>
      )}

      {/* Game Images */}
      <div className="fd-game-area">
        <div className="fd-images-grid">
          <div className="fd-image-container">
            <div className="fd-image-header">
              <span className="fd-image-label">Original</span>
            </div>
            <div 
              className={`fd-game-image fd-image-left fd-bg-${currentLevelData.background}`}
              onClick={(e) => handleImageClick(e, 'left')}
            >
              {generateImagePattern('left')}
              
              {/* Found differences markers */}
              {currentLevelData.differences.map(diff => 
                foundDifferences.includes(diff.id) && (
                  <div
                    key={`found-${diff.id}`}
                    className="fd-found-marker"
                    style={{
                      left: `${(diff.x / 400) * 100}%`,
                      top: `${(diff.y / 300) * 100}%`
                    }}
                  >
                    <div className="fd-found-circle">
                      <span className="fd-found-check">✓</span>
                    </div>
                  </div>
                )
              )}
              
              {/* Hint marker */}
              {showHint && currentLevelData.differences.find(d => !foundDifferences.includes(d.id)) && (
                <div
                  className="fd-hint-marker"
                  style={{
                    left: `${((currentLevelData.differences.find(d => !foundDifferences.includes(d.id))?.x || 0) / 400) * 100}%`,
                    top: `${((currentLevelData.differences.find(d => !foundDifferences.includes(d.id))?.y || 0) / 300) * 100}%`
                  }}
                >
                  <div className="fd-hint-pulse">💡</div>
                </div>
              )}
            </div>
          </div>

          <div className="fd-image-container">
            <div className="fd-image-header">
              <span className="fd-image-label">Find Differences</span>
            </div>
            <div 
              className={`fd-game-image fd-image-right fd-bg-${currentLevelData.background}`}
              onClick={(e) => handleImageClick(e, 'right')}
            >
              {generateImagePattern('right')}
              
              {/* Found differences markers */}
              {currentLevelData.differences.map(diff => 
                foundDifferences.includes(diff.id) && (
                  <div
                    key={`found-${diff.id}`}
                    className="fd-found-marker"
                    style={{
                      left: `${(diff.x / 400) * 100}%`,
                      top: `${(diff.y / 300) * 100}%`
                    }}
                  >
                    <div className="fd-found-circle">
                      <span className="fd-found-check">✓</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click Effects */}
      {clickEffects.map(effect => (
        <div
          key={effect.id}
          className={`fd-click-effect-global fd-effect-${effect.type}`}
          style={{
            left: effect.x,
            top: effect.y
          }}
        >
          {effect.type === 'correct' ? '✓' : '✗'}
        </div>
      ))}

      {/* Pause Overlay */}
      {gameState === 'paused' && (
        <div className="fd-overlay">
          <div className="fd-modal fd-pause-modal">
            <h2>Game Paused</h2>
            <p>Take a break and come back when you're ready!</p>
            <div className="fd-modal-buttons">
              <button className="fd-button fd-button-primary" onClick={resumeGame}>
                ▶️ Resume Game
              </button>
              <button className="fd-button fd-button-secondary" onClick={() => setGameState('welcome')}>
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === 'gameOver' && (
        <div className="fd-overlay">
          <div className="fd-modal fd-game-over-modal">
            <div className="fd-game-over-header">
              <h2>{currentLevel > Object.keys(levels).length ? '🎉 Congratulations!' : '💔 Game Over'}</h2>
              <p>{currentLevel > Object.keys(levels).length ? 'You completed all levels!' : 'Better luck next time!'}</p>
            </div>
            
            <div className="fd-final-stats">
              <div className="fd-final-stat">
                <span className="fd-final-label">Final Score</span>
                <span className="fd-final-value">{score.toLocaleString()}</span>
              </div>
              <div className="fd-final-stat">
                <span className="fd-final-label">Level Reached</span>
                <span className="fd-final-value">{currentLevel}</span>
              </div>
              <div className="fd-final-stat">
                <span className="fd-final-label">Differences Found</span>
                <span className="fd-final-value">{foundDifferences.length}</span>
              </div>
              {score > highScore && (
                <div className="fd-final-stat fd-new-record">
                  <span className="fd-final-label">🏆 New High Score!</span>
                </div>
              )}
            </div>
            
            <div className="fd-modal-buttons">
              <button className="fd-button fd-button-primary" onClick={startGame}>
                🎮 Play Again
              </button>
              <button className="fd-button fd-button-secondary" onClick={() => setGameState('welcome')}>
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindDifferenceGame;