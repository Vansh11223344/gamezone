import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Casino as CasinoIcon,
  Person as PersonIcon,
  SmartToy as ComputerIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import './Ludo.css';

const PLAYER_CONFIG = [
  { name: 'Red', color: '#e74c3c', home: [0, 0], pathIdx: 0 },
  { name: 'Green', color: '#2ecc71', home: [0, 11], pathIdx: 13 },
  { name: 'Yellow', color: '#f1c40f', home: [11, 11], pathIdx: 26 },
  { name: 'Blue', color: '#3498db', home: [11, 0], pathIdx: 39 },
];

const START_CELLS = [
  [[1, 1], [1, 3], [3, 1], [3, 3]], // Red
  [[1, 10], [1, 12], [3, 10], [3, 12]], // Green
  [[10, 10], [10, 12], [12, 10], [12, 12]], // Yellow
  [[10, 1], [10, 3], [12, 1], [12, 3]], // Blue
];

const MAIN_PATH = [
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [5, 5], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 8], [6, 8], [6, 9], [6, 10], [6, 11], [6, 12],
  [7, 12], [7, 11], [7, 10], [7, 9], [7, 8], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7],
  [12, 6], [11, 6], [10, 6], [9, 6], [8, 6], [7, 5], [7, 4], [7, 3], [7, 2], [7, 1], [7, 0],
  [6, 6], [7, 6],
];

const HOME_ENTRY = [1, 14, 27, 40];
const HOME_PATHS = [
  [[5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6]], // Red
  [[6, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13]], // Green
  [[8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7]], // Yellow
  [[7, 5], [7, 4], [7, 3], [7, 2], [7, 1], [7, 0]], // Blue
];

const TOKENS_TO_WIN = 4;
const SAFE_CELLS = [[1, 6], [6, 1], [6, 12], [11, 6], [6, 6], [7, 6]];

const PlayerTypes = [
  { label: 'Human', icon: <PersonIcon fontSize="small" /> },
  { label: 'Computer', icon: <ComputerIcon fontSize="small" /> },
];

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function arraysEqual(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function getTokenColor(i) {
  return ['red', 'green', 'yellow', 'blue'][i];
}

function initialTokens() {
  return [
    START_CELLS[0].map((pos) => ({ pos, home: false, pathPos: -1, finished: false })),
    START_CELLS[1].map((pos) => ({ pos, home: false, pathPos: -1, finished: false })),
    START_CELLS[2].map((pos) => ({ pos, home: false, pathPos: -1, finished: false })),
    START_CELLS[3].map((pos) => ({ pos, home: false, pathPos: -1, finished: false })),
  ];
}

function getNextPos(player, curr, steps) {
  if (curr.home) {
    let pos = curr.pathPos + steps;
    if (pos > 5) return null;
    return { home: true, pathPos: pos };
  }
  let next = (curr.pathPos + steps) % 52;
  const entry = HOME_ENTRY[player];
  if (
    (curr.pathPos < entry && next >= entry) ||
    (entry < curr.pathPos && (next >= entry || next < curr.pathPos))
  ) {
    let overSteps = steps - (entry - curr.pathPos);
    if (overSteps > 6) return null;
    if (overSteps < 0) overSteps += 52;
    if (overSteps <= 5) return { home: true, pathPos: overSteps };
  }
  return { home: false, pathPos: next };
}

function Ludo({ onHome }) {
  const [playerTypes, setPlayerTypes] = useState([0, 0, 0, 0]);
  const [modeSelect, setModeSelect] = useState(true);
  const [turn, setTurn] = useState(0);
  const [tokens, setTokens] = useState(initialTokens());
  const [dice, setDice] = useState(0);
  const [diceRolling, setDiceRolling] = useState(false);
  const [movable, setMovable] = useState([]);
  const [active, setActive] = useState(false);
  const [winner, setWinner] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const resize = () => {
      const size = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9, 500);
      document.documentElement.style.setProperty('--ludo-board-size', `${size}px`);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (winner.length === 4) return;
    const ms = [];
    tokens[turn].forEach((t, i) => {
      if (t.finished) return;
      if (t.pathPos === -1) {
        if (dice === 6) ms.push(i);
      } else {
        const dest = getNextPos(turn, t, dice);
        if (dest == null) return;
        if (dest.home && dest.pathPos === 5 && tokens[turn].filter((x) => x.finished).length >= TOKENS_TO_WIN - 1) {
          return;
        }
        const allPos = tokens[turn].map((x, ix) =>
          ix !== i && !x.finished ? (x.home ? `H${x.pathPos}` : `M${x.pathPos}`) : 0
        );
        if (!allPos.includes(dest.home ? `H${dest.pathPos}` : `M${dest.pathPos}`)) {
          ms.push(i);
        }
      }
    });
    setMovable(ms);
    setActive(ms.length > 0 || dice === 6);
    if (PlayerTypes[playerTypes[turn]].label === 'Computer') {
      if (ms.length > 0) {
        setTimeout(() => doMove(ms[Math.floor(Math.random() * ms.length)]), 800);
      } else if (dice !== 0) {
        setTimeout(nextTurn, 800);
      }
    } else if (ms.length === 0 && dice !== 0) {
      setTimeout(nextTurn, 800);
    }
  }, [dice, turn, tokens]);

  const nextTurn = () => {
    let t = (turn + 1) % 4;
    while (winner.includes(t) && t !== turn) t = (t + 1) % 4;
    setTurn(t);
    setDiceRolling(false);
    setDice(0);
    setActive(false);
    setMessage('');
  };

  const handleDiceRoll = () => {
    if (diceRolling || PlayerTypes[playerTypes[turn]].label === 'Computer') return;
    setDiceRolling(true);
    setMessage('Rolling...');
    setTimeout(() => {
      const d = rollDie();
      setDice(d);
      setDiceRolling(false);
      setMessage(`Rolled a ${d}!`);
      setTimeout(() => setMessage(''), 2000);
    }, 500);
  };

  const doMove = (i) => {
    if (!movable.includes(i) || diceRolling) return;
    const tok = tokens.map((t) => t.map((x) => ({ ...x })));
    const t = tok[turn][i];
    if (t.pathPos === -1) {
      t.pathPos = PLAYER_CONFIG[turn].pathIdx;
      t.pos = MAIN_PATH[t.pathPos];
    } else if (!t.home) {
      const dest = getNextPos(turn, t, dice);
      if (dest.home) {
        t.home = true;
        t.pathPos = dest.pathPos;
        t.pos = HOME_PATHS[turn][t.pathPos];
        if (dest.pathPos === 5) {
          t.finished = true;
        }
      } else {
        t.pathPos = dest.pathPos;
        t.pos = MAIN_PATH[t.pathPos];
      }
      if (!SAFE_CELLS.some((x) => arraysEqual(x, t.pos))) {
        for (let pl = 0; pl < 4; pl++) {
          if (pl !== turn) {
            tok[pl].forEach((ot, oi) => {
              if (!ot.finished && !ot.home && ot.pathPos !== -1 && arraysEqual(ot.pos, t.pos)) {
                tok[pl][oi] = {
                  ...START_CELLS[pl][oi],
                  pos: START_CELLS[pl][oi],
                  home: false,
                  pathPos: -1,
                  finished: false,
                };
              }
            });
          }
        }
      }
    } else {
      t.pathPos += dice;
      if (t.pathPos > 5) t.pathPos = 5;
      t.pos = HOME_PATHS[turn][t.pathPos];
      if (t.pathPos === 5) t.finished = true;
    }
    setTokens(tok);
    if (tok[turn].every((x) => x.finished)) {
      setWinner([...winner, turn]);
      setMessage(`Player ${PLAYER_CONFIG[turn].name} wins!`);
      setTimeout(nextTurn, 2000);
    } else if (dice === 6) {
      setActive(false);
      setMessage(`Rolled a 6! ${PLAYER_CONFIG[turn].name} goes again.`);
    } else {
      nextTurn();
    }
  };

  const handleTokenClick = (i) => {
    if (PlayerTypes[playerTypes[turn]].label !== 'Human' || !active) return;
    doMove(i);
  };

  const handlePlayerTypeChange = (idx, val) => {
    const next = [...playerTypes];
    next[idx] = val;
    setPlayerTypes(next);
  };

  const startGame = () => {
    setModeSelect(false);
    setWinner([]);
    setTokens(initialTokens());
    setTurn(0);
    setDice(0);
    setDiceRolling(false);
    setActive(false);
    setMessage('Roll the dice to start!');
  };

  const goHome = () => {
    if (typeof onHome === 'function') onHome();
  };

  if (modeSelect) {
    return (
      <Box className="ludo-setup-modal">
        <Typography variant="h5" gutterBottom>
          Ludo: Select Players
        </Typography>
        {PLAYER_CONFIG.map((pc, i) => (
          <Box key={pc.name} className="ludo-setup-row">
            <Box className="color-circle" sx={{ backgroundColor: pc.color }} />
            <Typography sx={{ color: pc.color, width: 60, fontWeight: 700 }}>
              {pc.name}
            </Typography>
            <Select
              value={playerTypes[i]}
              onChange={(e) => handlePlayerTypeChange(i, Number(e.target.value))}
              size="small"
              aria-label={`${pc.name} player type`}
            >
              {PlayerTypes.map((pt, j) => (
                <MenuItem key={pt.label} value={j}>
                  {pt.label}
                </MenuItem>
              ))}
            </Select>
            <Box sx={{ ml: 1 }}>{PlayerTypes[playerTypes[i]].icon}</Box>
          </Box>
        ))}
        <Button variant="contained" onClick={startGame} sx={{ mt: 2 }}>
          Start Game
        </Button>
        <Typography variant="caption" sx={{ mt: 2, color: '#777' }}>
          <CasinoIcon fontSize="small" /> 1-4 Human, 0-3 Computer: any combo!
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="ludo-outer">
      {message && (
        <Alert severity={message.includes('wins') ? 'success' : 'info'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      <Box className="ludo-topbar">
        <Box className="ludo-topbar-left">
          <Typography>
            Turn: <Box component="span" className="color-circle" sx={{ backgroundColor: PLAYER_CONFIG[turn].color }} />
            <b style={{ color: PLAYER_CONFIG[turn].color }}>{PLAYER_CONFIG[turn].name}</b>
          </Typography>
        </Box>
        <Box className="ludo-topbar-center">
          <Button
            variant="contained"
            onClick={() => setModeSelect(true)}
            sx={{ mr: 1 }}
          >
            Restart
          </Button>
          <Box className="ludo-dice-wrap">
            <Button
              disabled={diceRolling || PlayerTypes[playerTypes[turn]].label === 'Computer' || winner.includes(turn)}
              onClick={handleDiceRoll}
              className="ludo-dice-btn"
              startIcon={<CasinoIcon />}
              aria-label="Roll dice"
            >
              <Box component="span" className={`die num-${dice}`}>
                {diceRolling ? '…' : dice || '-'}
              </Box>
            </Button>
          </Box>
        </Box>
       
      </Box>
      <Box className="ludo-board-wrap">
        <LudoBoard tokens={tokens} turn={turn} onTokenClick={handleTokenClick} movable={movable} />
        <Box className="ludo-winners">
          {winner.length > 0 && (
            <Typography>
              Finished:{' '}
              {winner.map((i) => (
                <Box component="span" key={i} sx={{ color: PLAYER_CONFIG[i].color, mr: 1 }}>
                  {PLAYER_CONFIG[i].name}
                </Box>
              ))}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function LudoBoard({ tokens, turn, onTokenClick, movable }) {
  const size = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ludo-board-size') || 500, 10);

  const percent = (val) => (val * 100 / 15) + '%';

  return (
    <Box className="ludo-board" sx={{ width: size, height: size }}>
      <svg viewBox="0 0 450 450" width="100%" height="100%" style={{ display: 'block' }}>
        <rect x="0" y="0" width="450" height="450" fill="#fff" stroke="#333" strokeWidth="4" />
        {/* Home bases */}
        <rect x="0" y="0" width="150" height="150" fill="#e74c3c33" />
        <rect x="300" y="0" width="150" height="150" fill="#2ecc7133" />
        <rect x="300" y="300" width="150" height="150" fill="#f1c40f33" />
        <rect x="0" y="300" width="150" height="150" fill="#3498db33" />
        {/* Center triangle */}
        <polygon points="150,150 225,225 150,300 300,300 375,225 300,150" fill="#e74c3c" />
        <polygon points="150,150 225,225 300,150" fill="#2ecc71" />
        <polygon points="150,300 225,225 300,300" fill="#f1c40f" />
        <polygon points="300,150 375,225 300,300" fill="#3498db" />
        {/* Main path cells */}
        {MAIN_PATH.map((p, idx) => (
          <rect
            key={idx}
            x={p[1] * 30}
            y={p[0] * 30}
            width="30"
            height="30"
            fill={SAFE_CELLS.some((x) => arraysEqual(x, p)) ? '#d1d8e0' : '#fff'}
            stroke="#666"
            strokeWidth="1"
          />
        ))}
        {/* Home paths */}
        {HOME_PATHS.map((hp, i) =>
          hp.map((h, j) => (
            <rect
              key={`${i}-${j}`}
              x={h[1] * 30}
              y={h[0] * 30}
              width="30"
              height="30"
              fill={PLAYER_CONFIG[i].color}
              stroke="#333"
              strokeWidth="1"
            />
          ))
        )}
        {/* Start cells */}
        {[0, 1, 2, 3].map((i) =>
          START_CELLS[i].map((pos, pi) => (
            <circle
              key={`${i}-${pi}`}
              cx={pos[1] * 30 + 15}
              cy={pos[0] * 30 + 15}
              r="12"
              fill={PLAYER_CONFIG[i].color}
              stroke="#333"
              strokeWidth="1"
            />
          ))
        )}
      </svg>
      {tokens.map((group, pi) =>
        group.map((tok, ti) =>
          !tok.finished && (
            <Button
              key={`${pi}-${ti}`}
              className={`ludo-token ${getTokenColor(pi)} ${movable.includes(ti) && pi === turn ? 'movable' : ''}`}
              sx={{
                left: `calc(${percent(tok.pos[1])} + 2px)`,
                top: `calc(${percent(tok.pos[0])} + 2px)`,
                borderColor: PLAYER_CONFIG[pi].color,
                zIndex: pi === turn ? 2 : 1,
                boxShadow: pi === turn ? `0 0 8px 2px ${PLAYER_CONFIG[pi].color}66` : undefined,
              }}
              onClick={() => onTokenClick(ti)}
              aria-label={`${PLAYER_CONFIG[pi].name} pawn ${ti + 1}`}
            >
              <Box className="pawn-inner" />
            </Button>
          )
        )
      )}
    </Box>
  );
}

export default Ludo;