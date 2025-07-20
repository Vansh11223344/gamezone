import React, { useState, useRef } from "react";
import "./WordLadder.css";

const START_WORDS = [
  "COLD", "RATE", "EAST", "HARD", "SAND", "PLAY", "CANE", "FISH", "BARK", "GLOW",
  "START", "BONE", "FIRE", "KITE", "MOON", "CART", "DREAM", "FLAME", "GRASS", "STONE", "MATCH"
];
const END_WORDS = [
  "WARM", "MATE", "WEST", "EASY", "HAND", "STAY", "LANE", "WISH", "DARK", "SLOW",
  "STORM", "CONE", "WIRE", "SITE", "SOON", "PART", "CREAM", "BLAME", "BRASS", "SHONE", "PATCH"
];
const LEVELS = START_WORDS.map((s, i) => [s, END_WORDS[i]]);

const WORDS = [
  // 4-letter words
  "ABLE", "ACID", "AGED", "ALLY", "ARCH",
  "BAND", "BANK", "BARK", "BATH", "BEAM",
  "BEND", "BEST", "BILL", "BIRD", "BOLD",
  "BONE", "BOOK", "BOOM", "BURN", "BUSY",
  "CAKE", "CALM", "CAMP", "CANE", "CARD",
  "CARE", "CASH", "CAST", "CAVE", "CLAY",
  "CLUB", "COAL", "CODE", "COLD", "CORD",
  "CORK", "CORM", "CORN", "COST", "CROP",
  "CROW", "CUBE", "CURE", "DARK", "DART",
  "DASH", "DATE", "DAWN", "DEAL", "DEEP",
  "DEER", "DESK", "DICE", "DIRT", "DISC",
  "DISH", "DIVE", "DOOR", "DOWN", "DRAW",
  "DROP", "DUST", "EACH", "EASE", "EAST",
  "ECHO", "EDGE", "EVEN", "FACE", "FACT",
  "FAIR", "FALL", "FARM", "FAST", "FEAR",
  "FEEL", "FILE", "FILL", "FILM", "FIND",
  "FIRE", "FISH", "FLAG", "FLAT", "FLOW",
  "FOAM", "FOLD", "FOOD", "FOOT", "FORD",
  "FORK", "FORM", "FREE", "FUSE", "GAME",
  "GATE", "GEAR", "GIFT", "GLOW", "GOAL",
  "GOLD", "GOOD", "GRID", "GROW", "HAIL",
  "HAIR", "HALL", "HAND", "HANG", "HARD",
  "HARE", "HARM", "HEAD", "HEAT", "HERO",
  "HIDE", "HIGH", "HILL", "HOLD", "HOME",
  "HOOK", "HOPE", "HORN", "HOUR", "IDEA",
  "IRON", "JOIN", "JUMP", "KEEP", "KICK",
  "KIND", "KING", "KNOT", "LAKE", "LAND",
  "LANE", "LAST", "LEAD", "LEAF", "LEND",
  "LIFE", "LIFT", "LINE", "LINK", "LIST",
  "LOAD", "LOCK", "LOOK", "LOOP", "LOSE",
  "LOVE", "LUCK", "MAIL", "MAIN", "MAKE",
  "MARK", "MARE", "MATE", "MATH", "MEAL",
  "MEAT", "MIND", "MINE", "MIST", "MOOD",
  "MOON", "MOVE", "NAME", "NEAR", "NEST",
  "NEWS", "NOTE", "OPEN", "PACE", "PACK",
  "PAGE", "PAIN", "PAIR", "PARK", "PART",
  "PASS", "PAST", "PATH", "PEAK", "PICK",
  "PILE", "PINE", "PINK", "PLAN", "PLAY",
  "PLAT", "PLOW", "PLOT", "POOL", "PORT",
  "RARE", "RATE", "SAND", "SLAY", "SLOW",
  "STAR", "STAY", "WARD", "WARM", "WEST",
  "WISH",
  // 5-letter words
  "ALIVE", "APPLE", "ARROW", "ASSET", "AUDIO",
  "BASIC", "BEACH", "BLADE", "BLEND", "BLOCK",
  "BOARD", "BRAIN", "BRICK", "BRUSH", "BUILD",
  "CABLE", "CANDY", "CARRY", "CATCH", "CHAIN",
  "CHAIR", "CHART", "CHECK", "CHEST", "CLEAN",
  "CLEAR", "CLOCK", "CLOUD", "COACH", "COAST",
  "COVER", "CRAFT", "CRASH", "CROWD", "CROWN",
  "DANCE", "DREAM", "DRIFT", "DRIVE", "EASY",
  "EARTH", "ENTRY", "EVENT", "FAITH", "FENCE",
  "FIELD", "FLAME", "FLASH", "FLOOR", "FOCUS",
  "FORCE", "FRAME", "FRESH", "FRONT", "FRUIT",
  "GLASS", "GRASS", "GREEN", "GROUP", "GUIDE",
  "HEART", "HOUSE", "IMAGE", "INDEX", "INPUT",
  "ISSUE", "JUDGE", "LAYER", "LEARN", "LEVEL",
  "LIGHT", "LIMIT", "LOCAL", "LUCKY", "MARCH",
  "MATCH", "METAL", "MUSIC", "NIGHT", "NORTH",
  "OCEAN", "OFFER", "ORDER", "PAINT", "PAPER",
  "PARTY", "PEACE", "PHONE", "PIECE", "PLACE",
  "PLANT", "POINT", "POWER", "PRICE", "PRIDE",
  "PRINT", "QUICK", "RADIO", "RANGE", "REACH",
  "READY", "RIVER", "ROUND", "SCALE", "SCENE",
  "SCORE", "SHADE", "SHAPE", "SHARE", "SHIFT",
  "SHINE", "SHORE", "SIGHT", "SKILL", "SLEEP",
  "SMILE", "SOUND", "SOUTH", "SPACE", "SPARK",
  "SPEED", "SPORT", "STAFF", "STAGE", "STAND",
  "START", "STATE", "STEEL", "STONE", "STORM",
  "STORY", "STUDY", "STYLE", "SUGAR", "TABLE",
  "THEME", "TITLE", "TOUCH", "TOWER", "TRACK",
  "TRADE", "TRAIN", "TREND", "TRIAL", "TRUST",
  "TRUTH", "VOICE", "WATER", "WHEEL", "WHITE",
  "WORLD", "YOUTH"
];

function isRealWord(word) {
  return WORDS.includes(word.toUpperCase());
}

function differsByOneLetter(w1, w2) {
  if (w1.length !== w2.length) return false;
  let diff = 0;
  for (let i = 0; i < w1.length; i++) {
    if (w1[i] !== w2[i]) diff++;
  }
  return diff === 1;
}

export default function WordLadder() {
  const [level, setLevel] = useState(0);
  const [start, end] = LEVELS[level];
  const [ladder, setLadder] = useState([start]);
  const [input, setInput] = useState("");
  const [won, setWon] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef();

  function handleInput(e) {
    setInput(e.target.value.toUpperCase());
  }

  function submitGuess(e) {
    e.preventDefault();
    const word = input.toUpperCase();
    setError("");
    if (word.length !== start.length) {
      setError(`Word must be ${start.length} letters.`);
      return;
    }
    if (!isRealWord(word)) {
      setError("Not a valid word.");
      return;
    }
    if (!differsByOneLetter(ladder[ladder.length - 1], word)) {
      setError("Word must differ by only one letter.");
      return;
    }
    if (ladder.includes(word)) {
      setError("Already used.");
      return;
    }
    const newLadder = [...ladder, word];
    setLadder(newLadder);
    setInput("");
    if (word === end) setWon(true);
    if (inputRef.current) inputRef.current.focus();
  }

  function restart() {
    setLadder([LEVELS[level][0]]);
    setInput("");
    setError("");
    setWon(false);
  }

  function nextLevel() {
    let next = (level + 1) % LEVELS.length;
    setLevel(next);
    setLadder([LEVELS[next][0]]);
    setInput("");
    setError("");
    setWon(false);
  }

  return (
    <div className="wordladder-container">
      <h2 className="wordladder-title">WordLadder</h2>
      <div className="wordladder-desc">
        Transform <span className="word-tile start">{start}</span> → <span className="word-tile end">{end}</span>
        <br />
        Change only one letter per step. Every guess must be a real word!
      </div>
      <form className="wordladder-form" onSubmit={submitGuess} autoComplete="off">
        <input
          className="wordladder-input"
          type="text"
          value={input}
          onChange={handleInput}
          ref={inputRef}
          maxLength={start.length}
          disabled={won}
          placeholder="Type"
          autoFocus
        />
        <button type="submit" className="wordladder-btn" disabled={won}>
          Enter
        </button>
        <button type="button" className="wordladder-btn" onClick={restart}>
          Restart
        </button>
        <button type="button" className="wordladder-btn" onClick={nextLevel}>
          Next
        </button>
      </form>
      {error && <div className="wordladder-error">{error}</div>}
      <div className="wordladder-ladder">
        {ladder.map((word, i) => (
          <span
            className={
              "wordladder-ladder-word" +
              (i === 0 ? " start" : "") +
              (i === ladder.length - 1 && won ? " correct" : "")
            }
            key={word + i}
          >
            {[...word].map((ch, idx) => (
              <span className="wordladder-letter-tile" key={idx}>
                {ch}
              </span>
            ))}
          </span>
        ))}
      </div>
      <div className="wordladder-counter">
        Steps: <b>{ladder.length - 1}</b>
      </div>
      {won && (
        <div className="wordladder-win">
          🎉 Well done! You completed the ladder in {ladder.length - 1} steps.
          <br />
          <button className="wordladder-btn" onClick={nextLevel}>Next Puzzle</button>
        </div>
      )}
      <div className="wordladder-footer">Classic Word Ladder &ndash; puzzler theme</div>
    </div>
  );
}
