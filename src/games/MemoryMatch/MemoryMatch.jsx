import React, { useState, useEffect, useRef } from "react";
import "./MemoryMatch.css";

// Enhanced card themes with multiple difficulty levels
const THEMES = {
  animals: {
    name: "Animals",
    cards: ["🐶", "🐱", "🦊", "🐸", "🐵", "🐼", "🐮", "🐰", "🦁", "🐯", "🐻", "🐨"]
  },
  fruits: {
    name: "Fruits",
    cards: ["🍎", "🍌", "🍇", "🍓", "🍑", "🍊", "🥝", "🍍", "🥭", "🍈", "🍉", "🥥"]
  },
  vehicles: {
    name: "Vehicles",
    cards: ["🚗", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛"]
  },
  space: {
    name: "Space",
    cards: ["🚀", "🛸", "🌟", "⭐", "🌙", "🌍", "🪐", "☄️", "🌌", "🛰️", "👨‍🚀", "🔭"]
  }
};

const DIFFICULTY_LEVELS = {
  easy: { pairs: 6, gridCols: 3, name: "Easy (6 pairs)" },
  medium: { pairs: 8, gridCols: 4, name: "Medium (8 pairs)" },
  hard: { pairs: 12, gridCols: 4, name: "Hard (12 pairs)" }
};

function shuffleArray(array) {
  let arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createDeck(theme, difficulty) {
  const availableCards = THEMES[theme].cards;
  const pairCount = DIFFICULTY_LEVELS[difficulty].pairs;
  const selectedCards = availableCards.slice(0, pairCount);
  const doubles = [...selectedCards, ...selectedCards];
  
  return shuffleArray(doubles).map((emoji, index) => ({
    id: index,
    emoji,
    flipped: false,
    matched: false,
  }));
}

export default function MemoryMatch() {
  const [currentTheme, setCurrentTheme] = useState("animals");
  const [currentDifficulty, setCurrentDifficulty] = useState("medium");
  const [cards, setCards] = useState(() => createDeck(currentTheme, currentDifficulty));
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [win, setWin] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem(`memoryMatch_${currentTheme}_${currentDifficulty}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [streak, setStreak] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  
  const timerRef = useRef(null);
  const gameStartTimeRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (gameStarted && !win) {
      gameStartTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - gameStartTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    
    return () => clearInterval(timerRef.current);
  }, [gameStarted, win]);

  // Load best score when theme/difficulty changes
  useEffect(() => {
    const saved = localStorage.getItem(`memoryMatch_${currentTheme}_${currentDifficulty}`);
    setBestScore(saved ? JSON.parse(saved) : null);
  }, [currentTheme, currentDifficulty]);

  // Handle card click (flip)
  function onCardClick(index) {
    if (disabled) return;
    const card = cards[index];
    if (card.flipped || card.matched) return;

    if (!gameStarted) {
      setGameStarted(true);
    }

    if (flippedIndices.length === 0) {
      flipCard(index);
      setFlippedIndices([index]);
    } else if (flippedIndices.length === 1) {
      flipCard(index);
      setFlippedIndices([flippedIndices[0], index]);
      setDisabled(true);
      setMoves(moves + 1);

      // Compare cards after brief delay
      setTimeout(() => {
        compareCards(flippedIndices[0], index);
      }, 800);
    }
  }

  // Flip a card face-up 
  function flipCard(index) {
    setCards((prev) => {
      const updated = prev.slice();
      updated[index] = { ...updated[index], flipped: true };
      return updated;
    });
  }

  // Flip cards face-down
  function flipBack(indices) {
    setCards((prev) => {
      const updated = prev.slice();
      indices.forEach((i) => {
        if (!updated[i].matched) updated[i] = { ...updated[i], flipped: false };
      });
      return updated;
    });
  }

  // Mark cards matched
  function markMatched(indices) {
    setCards((prev) => {
      const updated = prev.slice();
      indices.forEach((i) => {
        updated[i] = { ...updated[i], matched: true };
      });
      return updated;
    });
  }

  // Check if flipped cards match or not
  function compareCards(i1, i2) {
    const card1 = cards[i1];
    const card2 = cards[i2];
    if (card1.emoji === card2.emoji) {
      markMatched([i1, i2]);
      setMatchedCount((count) => count + 2);
      setStreak(prev => prev + 1);
      setComboMultiplier(prev => Math.min(prev + 0.1, 3));
      setFlippedIndices([]);
      setDisabled(false);
      
      // Add celebration effect
      setTimeout(() => {
        const matchedElements = document.querySelectorAll('.memory-card.matched');
        matchedElements.forEach(el => el.classList.add('celebrate'));
      }, 100);
    } else {
      flipBack([i1, i2]);
      setStreak(0);
      setComboMultiplier(1);
      setFlippedIndices([]);
      setDisabled(false);
    }
  }

  // Check win condition
  useEffect(() => {
    if (matchedCount === cards.length && matchedCount > 0) {
      setWin(true);
      setGameStarted(false);
      
      // Calculate and save best score
      const score = { moves, time: timeElapsed, date: new Date().toLocaleDateString() };
      const currentBest = bestScore;
      
      if (!currentBest || moves < currentBest.moves || 
          (moves === currentBest.moves && timeElapsed < currentBest.time)) {
        setBestScore(score);
        localStorage.setItem(`memoryMatch_${currentTheme}_${currentDifficulty}`, JSON.stringify(score));
      }
    }
  }, [matchedCount, cards.length, moves, timeElapsed, bestScore]);

  // Restart the game
  function restart() {
    setCards(createDeck(currentTheme, currentDifficulty));
    setFlippedIndices([]);
    setDisabled(false);
    setMoves(0);
    setMatchedCount(0);
    setWin(false);
    setGameStarted(false);
    setTimeElapsed(0);
    setStreak(0);
    setComboMultiplier(1);
    clearInterval(timerRef.current);
  }

  // Change theme
  function changeTheme(theme) {
    setCurrentTheme(theme);
    setCards(createDeck(theme, currentDifficulty));
    setFlippedIndices([]);
    setDisabled(false);
    setMoves(0);
    setMatchedCount(0);
    setWin(false);
    setGameStarted(false);
    setTimeElapsed(0);
    setStreak(0);
    setComboMultiplier(1);
    clearInterval(timerRef.current);
  }

  // Change difficulty
  function changeDifficulty(difficulty) {
    setCurrentDifficulty(difficulty);
    setCards(createDeck(currentTheme, difficulty));
    setFlippedIndices([]);
    setDisabled(false);
    setMoves(0);
    setMatchedCount(0);
    setWin(false);
    setGameStarted(false);
    setTimeElapsed(0);
    setStreak(0);
    setComboMultiplier(1);
    clearInterval(timerRef.current);
  }

  // Format time
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="memory-container">
      <div className="game-header">
        <h1 className="memory-title">🧠 Memory Match</h1>
        <button 
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          aria-label="Game settings"
        >
          ⚙️
        </button>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="setting-group">
            <label>Theme:</label>
            <div className="theme-buttons">
              {Object.entries(THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  className={`theme-btn ${currentTheme === key ? 'active' : ''}`}
                  onClick={() => changeTheme(key)}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="setting-group">
            <label>Difficulty:</label>
            <div className="difficulty-buttons">
              {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
                <button
                  key={key}
                  className={`difficulty-btn ${currentDifficulty === key ? 'active' : ''}`}
                  onClick={() => changeDifficulty(key)}
                >
                  {level.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="game-stats">
        <div className="stat-item">
          <span className="stat-label">Moves:</span>
          <span className="stat-value">{moves}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Time:</span>
          <span className="stat-value">{formatTime(timeElapsed)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Streak:</span>
          <span className="stat-value">{streak}</span>
        </div>
        <button className="btn-restart" onClick={restart}>
          🔄 Restart
        </button>
      </div>

      {bestScore && (
        <div className="best-score">
          <span>🏆 Best: {bestScore.moves} moves in {formatTime(bestScore.time)}</span>
        </div>
      )}

      <div 
        className="memory-grid"
        style={{
          gridTemplateColumns: `repeat(${DIFFICULTY_LEVELS[currentDifficulty].gridCols}, 1fr)`
        }}
      >
        {cards.map((card, i) => (
          <div
            key={card.id}
            className={`memory-card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
            onClick={() => onCardClick(i)}
            role="button"
            aria-label={`Card ${card.flipped || card.matched ? card.emoji : 'hidden'}`}
            tabIndex={0}
            onKeyDown={e => {
              if(e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onCardClick(i);
              }
            }}
          >
            <div className="card-front">
              <span className="card-emoji">{card.emoji}</span>
            </div>
            <div className="card-back">
              <span className="card-question">?</span>
            </div>
          </div>
        ))}
      </div>

      {win && (
        <div className="win-message" role="alert" aria-live="assertive">
          <div className="win-content">
            <h2>🎉 Congratulations! 🎉</h2>
            <p>You completed the {THEMES[currentTheme].name} theme!</p>
            <div className="win-stats">
              <div className="win-stat">
                <span className="win-stat-value">{moves}</span>
                <span className="win-stat-label">Moves</span>
              </div>
              <div className="win-stat">
                <span className="win-stat-value">{formatTime(timeElapsed)}</span>
                <span className="win-stat-label">Time</span>
              </div>
              <div className="win-stat">
                <span className="win-stat-value">{Math.max(streak)}</span>
                <span className="win-stat-label">Max Streak</span>
              </div>
            </div>
            {bestScore && bestScore.moves === moves && bestScore.time === timeElapsed && (
              <div className="new-record">🏆 New Personal Best!</div>
            )}
            <div className="win-actions">
              <button className="btn-play-again" onClick={restart}>
                🔄 Play Again
              </button>
              <button className="btn-new-challenge" onClick={() => setShowSettings(true)}>
                🎯 New Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {!gameStarted && !win && (
        <div className="game-hint">
          <p>💡 Click any card to start the game!</p>
          <p>Match pairs of {THEMES[currentTheme].name.toLowerCase()} to win.</p>
        </div>
      )}
    </div>
  );
}