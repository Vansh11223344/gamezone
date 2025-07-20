import React, { useState, useEffect, useCallback } from "react";
import "./Hangman.css";

const WORDS = [
  { word: "APPLE", hint: "A common fruit often used in pies", category: "Food", difficulty: "easy" },
  { word: "BANANA", hint: "A long, curved fruit from tropical regions", category: "Food", difficulty: "easy" },
  { word: "CHERRY", hint: "A small, red fruit often on desserts", category: "Food", difficulty: "easy" },
  { word: "ORANGE", hint: "A juicy citrus fruit with bright color", category: "Food", difficulty: "easy" },
  { word: "MANGO", hint: "A sweet, tropical fruit with a pit", category: "Food", difficulty: "medium" },
  { word: "PEACH", hint: "A fuzzy fruit with a single pit", category: "Food", difficulty: "medium" },
  { word: "GRAPE", hint: "A small fruit that grows in clusters", category: "Food", difficulty: "easy" },
  { word: "LEMON", hint: "A sour, yellow fruit used in drinks", category: "Food", difficulty: "easy" },
  { word: "KIWI", hint: "A small fruit with green flesh", category: "Food", difficulty: "medium" },
  { word: "PINEAPPLE", hint: "A spiky tropical fruit with sweet flesh", category: "Food", difficulty: "medium" },
  { word: "WATERMELON", hint: "A large fruit with juicy red flesh", category: "Food", difficulty: "medium" },
  { word: "STRAWBERRY", hint: "A red fruit with tiny seeds outside", category: "Food", difficulty: "easy" },
  { word: "BLUEBERRY", hint: "A small blue fruit used in muffins", category: "Food", difficulty: "easy" },
  { word: "AVOCADO", hint: "A creamy fruit used in guacamole", category: "Food", difficulty: "medium" },
  { word: "COCONUT", hint: "A hard-shelled fruit with milky inside", category: "Food", difficulty: "medium" },
  { word: "APRICOT", hint: "A small, orange fruit like a peach", category: "Food", difficulty: "medium" },
  { word: "PLUM", hint: "A juicy fruit with a single pit", category: "Food", difficulty: "easy" },
  { word: "POMEGRANATE", hint: "A fruit with ruby-red seeds", category: "Food", difficulty: "hard" },
  { word: "FIG", hint: "A soft fruit with many tiny seeds", category: "Food", difficulty: "medium" },
  { word: "TANGERINE", hint: "A small, easy-to-peel citrus fruit", category: "Food", difficulty: "medium" },
  { word: "DOG", hint: "A loyal pet known as man's best friend", category: "Animals", difficulty: "easy" },
  { word: "CAT", hint: "A house pet known for independence", category: "Animals", difficulty: "easy" },
  { word: "BIRD", hint: "A winged creature that often flies", category: "Animals", difficulty: "easy" },
  { word: "FISH", hint: "An aquatic creature living in water", category: "Animals", difficulty: "easy" },
  { word: "TIGER", hint: "A large, striped feline in the wild", category: "Animals", difficulty: "medium" },
  { word: "LION", hint: "The king of the jungle", category: "Animals", difficulty: "easy" },
  { word: "ELEPHANT", hint: "A large animal with a long trunk", category: "Animals", difficulty: "medium" },
  { word: "GIRAFFE", hint: "The tallest land animal with a long neck", category: "Animals", difficulty: "medium" },
  { word: "ZEBRA", hint: "An animal with black and white stripes", category: "Animals", difficulty: "easy" },
  { word: "MONKEY", hint: "A playful animal that swings from trees", category: "Animals", difficulty: "easy" },
  { word: "BEAR", hint: "A large mammal that hibernates", category: "Animals", difficulty: "medium" },
  { word: "WOLF", hint: "A wild canine that howls at the moon", category: "Animals", difficulty: "medium" },
  { word: "FOX", hint: "A cunning animal with a bushy tail", category: "Animals", difficulty: "medium" },
  { word: "DEER", hint: "A graceful animal with antlers", category: "Animals", difficulty: "medium" },
  { word: "RABBIT", hint: "A small animal with long ears", category: "Animals", difficulty: "easy" },
  { word: "HORSE", hint: "A strong animal used for riding", category: "Animals", difficulty: "easy" },
  { word: "SNAKE", hint: "A slithering reptile with no legs", category: "Animals", difficulty: "medium" },
  { word: "CROCODILE", hint: "A large reptile near water", category: "Animals", difficulty: "hard" },
  { word: "PENGUIN", hint: "A flightless bird that waddles on ice", category: "Animals", difficulty: "medium" },
  { word: "DOLPHIN", hint: "A playful marine mammal", category: "Animals", difficulty: "medium" },
  { word: "SUN", hint: "The star that lights the Earth", category: "Nature", difficulty: "easy" },
  { word: "MOON", hint: "Earth's satellite visible at night", category: "Nature", difficulty: "easy" },
  { word: "STAR", hint: "A twinkling light in the night sky", category: "Nature", difficulty: "easy" },
  { word: "CLOUD", hint: "A fluffy formation that may bring rain", category: "Nature", difficulty: "easy" },
  { word: "RAIN", hint: "Water droplets falling from the sky", category: "Nature", difficulty: "easy" },
  { word: "SNOW", hint: "Frozen water falling as white flakes", category: "Nature", difficulty: "easy" },
  { word: "WIND", hint: "Moving air that rustles leaves", category: "Nature", difficulty: "easy" },
  { word: "OCEAN", hint: "A vast body of saltwater", category: "Nature", difficulty: "medium" },
  { word: "RIVER", hint: "A flowing body of water through land", category: "Nature", difficulty: "easy" },
  { word: "MOUNTAIN", hint: "A tall, rocky formation", category: "Nature", difficulty: "medium" },
  { word: "FOREST", hint: "A large area with trees and wildlife", category: "Nature", difficulty: "medium" },
  { word: "DESERT", hint: "A dry, sandy region with little vegetation", category: "Nature", difficulty: "medium" },
  { word: "BEACH", hint: "A sandy shoreline by the sea", category: "Nature", difficulty: "easy" },
  { word: "ISLAND", hint: "Land surrounded by water", category: "Nature", difficulty: "medium" },
  { word: "LAKE", hint: "A large body of water surrounded by land", category: "Nature", difficulty: "easy" },
  { word: "VALLEY", hint: "A low area between hills", category: "Nature", difficulty: "medium" },
  { word: "FLOWER", hint: "A colorful blooming plant part", category: "Plants", difficulty: "easy" },
  { word: "TREE", hint: "A tall plant with a trunk and branches", category: "Plants", difficulty: "easy" },
  { word: "ROSE", hint: "A flower symbolizing love", category: "Plants", difficulty: "easy" },
  { word: "TULIP", hint: "A vibrant, cup-shaped flower", category: "Plants", difficulty: "medium" },
  { word: "DAISY", hint: "A simple flower with white petals", category: "Plants", difficulty: "easy" },
  { word: "SUNFLOWER", hint: "A tall flower that follows the sun", category: "Plants", difficulty: "medium" },
  { word: "CACTUS", hint: "A spiky plant thriving in deserts", category: "Plants", difficulty: "medium" },
  { word: "BAMBOO", hint: "A fast-growing plant used in building", category: "Plants", difficulty: "medium" },
  { word: "LILY", hint: "A delicate flower used in bouquets", category: "Plants", difficulty: "medium" },
  { word: "MAPLE", hint: "A tree with colorful autumn leaves", category: "Plants", difficulty: "medium" },
  { word: "OAK", hint: "A sturdy tree known for acorns", category: "Plants", difficulty: "medium" },
  { word: "PINE", hint: "An evergreen tree with needles", category: "Plants", difficulty: "medium" },
  { word: "CAR", hint: "A four-wheeled vehicle for transport", category: "Vehicles", difficulty: "easy" },
  { word: "BICYCLE", hint: "A two-wheeled vehicle powered by pedaling", category: "Vehicles", difficulty: "easy" },
  { word: "BOAT", hint: "A vehicle that travels on water", category: "Vehicles", difficulty: "easy" },
  { word: "TRAIN", hint: "A vehicle on tracks for long distances", category: "Vehicles", difficulty: "easy" },
  { word: "PLANE", hint: "A vehicle that flies in the sky", category: "Vehicles", difficulty: "easy" },
  { word: "BUS", hint: "A large vehicle for many passengers", category: "Vehicles", difficulty: "easy" },
  { word: "HOUSE", hint: "A building where people live", category: "Buildings", difficulty: "easy" },
  { word: "CASTLE", hint: "A medieval fortified building", category: "Buildings", difficulty: "medium" },
  { word: "BRIDGE", hint: "A structure crossing rivers or roads", category: "Buildings", difficulty: "medium" },
  { word: "TOWER", hint: "A tall structure used as a landmark", category: "Buildings", difficulty: "medium" },
  { word: "BOOK", hint: "A collection of pages with stories", category: "Objects", difficulty: "easy" },
  { word: "PEN", hint: "A tool for writing or drawing", category: "Objects", difficulty: "easy" },
  { word: "PENCIL", hint: "A writing tool with an eraser", category: "Objects", difficulty: "easy" },
  { word: "CHAIR", hint: "Furniture for sitting", category: "Objects", difficulty: "easy" },
  { word: "TABLE", hint: "Furniture with a flat surface", category: "Objects", difficulty: "easy" },
  { word: "WINDOW", hint: "An opening in a wall for light", category: "Objects", difficulty: "easy" },
  { word: "DOOR", hint: "A barrier to enter or exit", category: "Objects", difficulty: "easy" },
  { word: "CLOCK", hint: "A device that shows the time", category: "Objects", difficulty: "easy" },
  { word: "LAMP", hint: "A device for artificial light", category: "Objects", difficulty: "easy" },
  { word: "MIRROR", hint: "A surface that reflects images", category: "Objects", difficulty: "easy" },
  { word: "SHOE", hint: "Footwear for protection or style", category: "Clothing", difficulty: "easy" },
  { word: "HAT", hint: "A head covering for warmth or style", category: "Clothing", difficulty: "easy" },
  { word: "SHIRT", hint: "Clothing for the upper body", category: "Clothing", difficulty: "easy" },
  { word: "PANTS", hint: "Clothing for the lower body", category: "Clothing", difficulty: "easy" },
  { word: "SOCK", hint: "Clothing worn on the foot", category: "Clothing", difficulty: "easy" },
  { word: "GLOVE", hint: "A covering for the hand", category: "Clothing", difficulty: "easy" },
  { word: "SCARF", hint: "Fabric worn around the neck", category: "Clothing", difficulty: "easy" },
  { word: "UMBRELLA", hint: "A tool to stay dry in rain", category: "Objects", difficulty: "easy" },
  { word: "BAG", hint: "A container for carrying items", category: "Objects", difficulty: "easy" },
  { word: "WATCH", hint: "A timekeeping device for the wrist", category: "Objects", difficulty: "easy" },
  { word: "RING", hint: "Jewelry worn on the finger", category: "Objects", difficulty: "easy" },
  { word: "PIANO", hint: "A musical instrument with keys", category: "Music", difficulty: "medium" },
  { word: "GUITAR", hint: "A stringed musical instrument", category: "Music", difficulty: "medium" },
  { word: "DRUM", hint: "A percussion instrument you hit", category: "Music", difficulty: "medium" },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_WRONG = 6;

function getRandomWord(excludeIdx) {
  let idx;
  do {
    idx = Math.floor(Math.random() * WORDS.length);
  } while (idx === excludeIdx);
  return idx;
}

export default function GothicHangman() {
  const [usedLetters, setUsedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [wordIndex, setWordIndex] = useState(() => getRandomWord(-1));
  const [correctLetters, setCorrectLetters] = useState([]);
  const [gameState, setGameState] = useState("playing");
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const currentWord = WORDS[wordIndex];
  const word = currentWord.word.toUpperCase();

  const playSound = (type) => {
    console.log(`Playing ${type} sound`);
  };

  const handleLetterGuess = (letter) => {
    if (usedLetters.includes(letter) || gameState !== "playing") return;

    const newUsedLetters = [...usedLetters, letter];
    setUsedLetters(newUsedLetters);

    if (word.includes(letter)) {
      const newCorrectLetters = [...correctLetters, letter];
      setCorrectLetters(newCorrectLetters);
      playSound("correct");

      if (word.split("").every((char) => newCorrectLetters.includes(char))) {
        setGameState("won");
        const points = (MAX_WRONG - wrongGuesses + 1) * 10;
        setScore(score + points);
        setStreak(streak + 1);
        playSound("win");
      }
    } else {
      const newWrongCount = wrongGuesses + 1;
      setWrongGuesses(newWrongCount);
      playSound("wrong");

      if (newWrongCount >= MAX_WRONG) {
        setGameState("lost");
        setStreak(0);
        playSound("lose");
      }
    }
  };

  const handleKeydown = useCallback(
    (e) => {
      const letter = e.key.toUpperCase();
      if (ALPHABET.includes(letter)) {
        handleLetterGuess(letter);
      }
    },
    [usedLetters, gameState, word, correctLetters, wrongGuesses, score, streak]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [handleKeydown]);

  const startNewGame = () => {
    const newWordIndex = getRandomWord(wordIndex);
    setWordIndex(newWordIndex);
    setUsedLetters([]);
    setWrongGuesses(0);
    setCorrectLetters([]);
    setGameState("playing");
    setShowHint(false);
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const renderWord = () => {
    return word.split("").map((letter, index) => (
      <span
        key={index}
        className={`gothic-hangman-word-letter ${
          correctLetters.includes(letter) || gameState === "lost" ? "revealed" : ""
        }`}
      >
        {correctLetters.includes(letter) || gameState === "lost" ? letter : "_"}
      </span>
    ));
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "#4ade80";
      case "medium":
        return "#fbbf24";
      case "hard":
        return "#f87171";
      default:
        return "#94a3b8";
    }
  };

  return (
    <div className="gothic-hangman-wrapper">
      <div className="gothic-hangman-container">
        <header className="gothic-hangman-game-header">
          <h1 className="gothic-hangman-game-title">THE GALLOWS</h1>
          <div className="gothic-hangman-game-stats">
            <div className="gothic-hangman-stat">
              Score: <span>{score}</span>
            </div>
            <div className="gothic-hangman-stat">
              Streak: <span>{streak}</span>
            </div>
          </div>
        </header>

        <main className="gothic-hangman-game-main">
          <section className="gothic-hangman-gallows-section">
            <div className="gothic-hangman-gallows-container">
              <GothicGallows wrongGuesses={wrongGuesses} />
            </div>
            <div className="gothic-hangman-atmosphere-effects">
              <div className="gothic-hangman-fog"></div>
            </div>
          </section>

          <section className="gothic-hangman-game-info">
            <div className="gothic-hangman-word-container">
              <div className="gothic-hangman-word-display">{renderWord()}</div>
              <div className="gothic-hangman-word-meta">
                <span className="gothic-hangman-category">{currentWord.category}</span>
                <span
                  className="gothic-hangman-difficulty"
                  style={{ color: getDifficultyColor(currentWord.difficulty) }}
                >
                  {currentWord.difficulty.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="gothic-hangman-hint-section">
              <button
                className={`gothic-hangman-hint-button ${showHint ? "active" : ""}`}
                onClick={toggleHint}
              >
                💀 Reveal Hint
              </button>
              {showHint && (
                <div className="gothic-hangman-hint-text">
                  <span className="gothic-hangman-hint-label">Hint:</span> {currentWord.hint}
                </div>
              )}
            </div>

            <div className="gothic-hangman-alphabet-container">
              {ALPHABET.map((letter) => (
                <button
                  key={letter}
                  className={`gothic-hangman-letter-button ${
                    usedLetters.includes(letter) ? (word.includes(letter) ? "correct" : "wrong") : ""
                  }`}
                  disabled={usedLetters.includes(letter) || gameState !== "playing"}
                  onClick={() => handleLetterGuess(letter)}
                >
                  {letter}
                </button>
              ))}
            </div>

            <div className="gothic-hangman-game-status">
              {gameState === "playing" && (
                <div className="gothic-hangman-tries-remaining">
                  <span className="gothic-hangman-skull">💀</span>
                  Lives Remaining: {MAX_WRONG - wrongGuesses}
                </div>
              )}
              {gameState === "won" && (
                <div className="gothic-hangman-victory-message">
                  <span className="gothic-hangman-victory-icon">⚡</span>
                  You escaped the gallows! The word was: <strong>{word}</strong>
                </div>
              )}
              {gameState === "lost" && (
                <div className="gothic-hangman-defeat-message">
                  <span className="gothic-hangman-defeat-icon">☠️</span>
                  The executioner claims another soul... The word was: <strong>{word}</strong>
                </div>
              )}
            </div>

            <button className="gothic-hangman-new-game-button" onClick={startNewGame}>
              {gameState === "playing" ? "⚔️ New Challenge" : "🔄 Rise Again"}
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}

function GothicGallows({ wrongGuesses }) {
  return (
    <div className="gothic-hangman-gallows-svg-container">
      <svg viewBox="0 0 200 280" className="gothic-hangman-gallows-svg">
        <rect x="10" y="260" width="180" height="15" rx="5" fill="#2a2a2a" />
        <rect x="20" y="250" width="20" height="25" fill="#3a3a3a" />
        <rect x="25" y="80" width="15" height="170" fill="#4a4a4a" />
        <rect x="25" y="80" width="80" height="12" rx="6" fill="#4a4a4a" />
        <rect x="95" y="92" width="8" height="25" rx="4" fill="#4a4a4a" />
        <path
          d="M99 117 Q101 120 99 123 Q97 126 99 129 Q101 132 99 135 Q97 138 99 141"
          stroke="#8B4513"
          strokeWidth="3"
          fill="none"
        />
        {wrongGuesses > 0 && (
          <g className="gothic-hangman-part gothic-hangman-head">
            <circle cx="99" cy="155" r="15" stroke="#2d1b1b" strokeWidth="3" fill="#3a2a2a" />
            <circle cx="94" cy="150" r="2" fill="#ff4444" />
            <circle cx="104" cy="150" r="2" fill="#ff4444" />
            <path d="M94 162 Q99 165 104 162" stroke="#2d1b1b" strokeWidth="2" fill="none" />
          </g>
        )}
        {wrongGuesses > 1 && (
          <rect
            x="97"
            y="170"
            width="4"
            height="40"
            fill="#3a2a2a"
            className="gothic-hangman-part gothic-hangman-body"
          />
        )}
        {wrongGuesses > 2 && (
          <rect
            x="85"
            y="175"
            width="3"
            height="25"
            fill="#3a2a2a"
            transform="rotate(-30 87 175)"
            className="gothic-hangman-part gothic-hangman-left-arm"
          />
        )}
        {wrongGuesses > 3 && (
          <rect
            x="112"
            y="175"
            width="3"
            height="25"
            fill="#3a2a2a"
            transform="rotate(30 114 175)"
            className="gothic-hangman-part gothic-hangman-right-arm"
          />
        )}
        {wrongGuesses > 4 && (
          <rect
            x="92"
            y="210"
            width="3"
            height="30"
            fill="#3a2a2a"
            transform="rotate(-20 94 210)"
            className="gothic-hangman-part gothic-hangman-left-leg"
          />
        )}
        {wrongGuesses > 5 && (
          <rect
            x="104"
            y="210"
            width="3"
            height="30"
            fill="#3a2a2a"
            transform="rotate(20 106 210)"
            className="gothic-hangman-part gothic-hangman-right-leg"
          />
        )}
        <g className="gothic-hangman-atmosphere">
          <circle cx="160" cy="40" r="25" fill="#666" opacity="0.3" className="gothic-hangman-cloud" />
          <circle cx="170" cy="35" r="20" fill="#666" opacity="0.3" className="gothic-hangman-cloud" />
          <circle cx="150" cy="35" r="20" fill="#666" opacity="0.3" className="gothic-hangman-cloud" />
        </g>
      </svg>
    </div>
  );
}