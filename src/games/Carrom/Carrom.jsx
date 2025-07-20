import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, Select, MenuItem, Alert, Slider } from '@mui/material';
import './CarromBoard.css';

const BOARD_SIZE = 360;
const POCKET_RADIUS = 22;
const COIN_RADIUS = 10;
const STRIKER_RADIUS = 14;
const FRICTION = 0.98; // Lower friction for hard board
const MAX_SPEED = 18; // Realistic max speed

const COLORS = ['#df232b', '#319b2e', '#fcc800', '#2c6cff'];

const createCoins = () => [
  ...Array.from({ length: 6 }, (_, i) => ({
    x: BOARD_SIZE * 0.5 + 30 * Math.cos((Math.PI * i) / 3),
    y: BOARD_SIZE * 0.5 + 30 * Math.sin((Math.PI * i) / 3),
    color: 'black',
    id: `b${i}`,
    vx: 0,
    vy: 0,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    x: BOARD_SIZE * 0.5 + 20 * Math.cos((Math.PI * i) / 3 + Math.PI / 6),
    y: BOARD_SIZE * 0.5 + 20 * Math.sin((Math.PI * i) / 3 + Math.PI / 6),
    color: 'white',
    id: `w${i}`,
    vx: 0,
    vy: 0,
  })),
  {
    x: BOARD_SIZE * 0.5,
    y: BOARD_SIZE * 0.5,
    color: 'red',
    id: 'queen',
    vx: 0,
    vy: 0,
  },
];

const INIT_COINS = createCoins();

const POCKETS = [
  { x: POCKET_RADIUS, y: POCKET_RADIUS },
  { x: BOARD_SIZE - POCKET_RADIUS, y: POCKET_RADIUS },
  { x: POCKET_RADIUS, y: BOARD_SIZE - POCKET_RADIUS },
  { x: BOARD_SIZE - POCKET_RADIUS, y: BOARD_SIZE - POCKET_RADIUS },
];

const PLAYER_TYPES = [
  { label: 'Human', icon: '👤' },
  { label: 'Computer', icon: '🤖' },
];

const distance = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

const genPlayerColors = (count) => {
  if (count === 2) return ['#df232b', '#2c6cff'];
  if (count === 3) return ['#df232b', '#319b2e', '#fcc800'];
  return COLORS;
};

const getNextPlayerIdx = (players, curr) => {
  for (let i = 1; i <= players.length; ++i) {
    const tryIdx = (curr + i) % players.length;
    if (!players[tryIdx].out) return tryIdx;
  }
  return curr;
};

const pocketSummary = (pocketed, playerId) => {
  let white = 0, black = 0, red = 0;
  for (const p of pocketed) {
    if (p.player !== playerId) continue;
    if (p.color === 'white') white++;
    else if (p.color === 'black') black++;
    else if (p.color === 'red') red++;
  }
  return {
    white,
    black,
    red,
    total: white + black + (red > 0 && (white + black > 0) ? 3 : 0),
  };
};

function CarromBoard() {
  const [setup, setSetup] = useState(true);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerTypes, setPlayerTypes] = useState([0, 0, 0, 0]);
  const [players, setPlayers] = useState([
    { id: 0, type: 0, score: 0, out: false, queenCovered: false },
    { id: 1, type: 0, score: 0, out: false, queenCovered: false },
  ]);
  const [coins, setCoins] = useState([...INIT_COINS]);
  const [pocketed, setPocketed] = useState([]);
  const [turn, setTurn] = useState(0);
  const [striker, setStriker] = useState({
    x: BOARD_SIZE * 0.5,
    y: BOARD_SIZE - 34,
    vx: 0,
    vy: 0,
  });
  const [strikePower, setStrikePower] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [aim, setAim] = useState(null);
  const [moving, setMoving] = useState(false);
  const [message, setMessage] = useState('');
  const [screen, setScreen] = useState(BOARD_SIZE);
  const svgRef = useRef();

  useEffect(() => {
    const resize = () => {
      const size = Math.floor(Math.min(window.innerWidth, window.innerHeight - 180, 410));
      setScreen(Math.max(size, 240));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const handleSetupChange = (i, type) => {
    setPlayerTypes((arr) => {
      const out = [...arr];
      out[i] = Number(type);
      return out;
    });
  };

  const handleCountChange = (e) => {
    const count = Number(e.target.value);
    setPlayerCount(count);
    setPlayerTypes((a) => a.slice(0, count).concat([0, 0, 0, 0].slice(count)));
  };

  const startGame = () => {
    setPlayers(
      Array.from({ length: playerCount }, (_, i) => ({
        id: i,
        type: playerTypes[i],
        score: 0,
        out: false,
        queenCovered: false,
      }))
    );
    setSetup(false);
    setCoins([...INIT_COINS]);
    setPocketed([]);
    setStriker({ x: BOARD_SIZE * 0.5, y: BOARD_SIZE - 34, vx: 0, vy: 0 });
    setDragging(false);
    setMoving(false);
    setAim(null);
    setTurn(0);
    setStrikePower(50);
    setMessage('Player 1, position the striker!');
  };

  const handleStrikerDrag = (e) => {
    if (moving) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = BOARD_SIZE / rect.width;
    const mx = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scale;
    const nx = Math.max(
      POCKET_RADIUS + STRIKER_RADIUS + 3,
      Math.min(mx, BOARD_SIZE - POCKET_RADIUS - STRIKER_RADIUS - 3)
    );
    setStriker((s) => ({ ...s, x: nx }));
  };

  const handleAimStart = (e) => {
    if (moving || dragging) return;
    setDragging(true);
    const rect = svgRef.current.getBoundingClientRect();
    const scale = BOARD_SIZE / rect.width;
    const mx = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scale;
    const my = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scale;
    setAim({ x: mx, y: my });
  };

  const handleAimMove = (e) => {
    if (!dragging) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = BOARD_SIZE / rect.width;
    const mx = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scale;
    const my = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scale;
    setAim({ x: mx, y: my });
  };

  const handleAimEnd = () => {
    setDragging(false);
    if (!aim) return;
    if (aim.y < striker.y - 25) {
      shootStriker(aim.x, aim.y, strikePower);
    }
    setAim(null);
  };

  const shootStriker = (ax, ay, powerPercent) => {
    if (moving) return;
    setMoving(true);
    const dx = ax - striker.x;
    const dy = ay - striker.y;
    const norm = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 4 + (powerPercent / 100) * (MAX_SPEED - 4);
    let s = { ...striker, vx: (dx / norm) * speed, vy: (dy / norm) * speed };
    let newCoins = [...coins];
    let pocketedThisShot = false;
    let queenPocketed = false;

    const reflectOnBoundary = (obj, radius) => {
      if (obj.x - radius <= 0) {
        obj.x = radius + 1;
        obj.vx = -obj.vx * 0.9;
      } else if (obj.x + radius >= BOARD_SIZE) {
        obj.x = BOARD_SIZE - radius - 1;
        obj.vx = -obj.vx * 0.9;
      }
      if (obj.y - radius <= 0) {
        obj.y = radius + 1;
        obj.vy = -obj.vy * 0.9;
      } else if (obj.y + radius >= BOARD_SIZE) {
        obj.y = BOARD_SIZE - radius - 1;
        obj.vy = -obj.vy * 0.9;
      }
    };

    const interval = setInterval(() => {
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= FRICTION;
      s.vy *= FRICTION;
      reflectOnBoundary(s, STRIKER_RADIUS);

      if (
        POCKETS.some((pkt) => distance(s.x, s.y, pkt.x, pkt.y) < POCKET_RADIUS - 2)
      ) {
        clearInterval(interval);
        setMoving(false);
        setStriker({ x: BOARD_SIZE * 0.5, y: BOARD_SIZE - 34, vx: 0, vy: 0 });
        setMessage(`Player ${turn + 1} fouled! Striker pocketed.`);
        setTimeout(() => setMessage(''), 1800);
        proceedTurn(false, false);
        return;
      }

      for (let i = 0; i < newCoins.length; i++) {
        const coin = newCoins[i];
        if (distance(s.x, s.y, coin.x, coin.y) < COIN_RADIUS + STRIKER_RADIUS - 2) {
          const dx = coin.x - s.x;
          const dy = coin.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;
          const dot = s.vx * nx + s.vy * ny;
          coin.vx = 2 * dot * nx - s.vx;
          coin.vy = 2 * dot * ny - s.vy;
          s.vx = s.vx - dot * nx;
          s.vy = s.vy - dot * ny;
          newCoins[i] = { ...coin };
        }
      }

      newCoins = newCoins
        .map((coin) => {
          if (Math.abs(coin.vx) < 0.1 && Math.abs(coin.vy) < 0.1) return coin;
          let newX = coin.x + coin.vx;
          let newY = coin.y + coin.vy;
          coin.vx *= FRICTION;
          coin.vy *= FRICTION;

          const pocket = POCKETS.find((pkt) => {
            const dist = distance(newX, newY, pkt.x, pkt.y);
            if (dist >= POCKET_RADIUS - 2) return false;
            const dx = pkt.x - newX;
            const dy = pkt.y - newY;
            const dot = coin.vx * dx + coin.vy * dy;
            return dot > 0; // Coin must move toward pocket
          });
          if (pocket) {
            pocketedThisShot = true;
            if (coin.color === 'red') queenPocketed = true;
            setPocketed((pc) => [...pc, { color: coin.color, player: turn }]);
            setMessage(`Player ${turn + 1} pocketed ${coin.color}!`);
            setTimeout(() => setMessage(''), 1400);
            return null;
          }

          let c = { ...coin, x: newX, y: newY };
          reflectOnBoundary(c, COIN_RADIUS);
          return c;
        })
        .filter(Boolean);

      setCoins(newCoins);
      setStriker({ ...s });

      if (
        Math.abs(s.vx) < 0.1 &&
        Math.abs(s.vy) < 0.1 &&
        newCoins.every((c) => Math.abs(c.vx) < 0.1 && Math.abs(c.vy) < 0.1)
      ) {
        clearInterval(interval);
        setMoving(false);
        setStriker({ x: BOARD_SIZE * 0.5, y: BOARD_SIZE - 34, vx: 0, vy: 0 });
        proceedTurn(pocketedThisShot, queenPocketed);
      }
    }, 15);
  };

  const proceedTurn = (justPocketed, queenPocketed) => {
    setPlayers((prev) =>
      prev.map((p, i) => {
        if (i !== turn) return p;
        const stats = pocketSummary(pocketed, i);
        const score = stats.white + stats.black + (stats.red > 0 && (stats.white + stats.black > 0) ? 3 : 0);
        return { ...p, score, queenCovered: stats.red > 0 && (stats.white + stats.black > 0) };
      })
    );

    if (queenPocketed && !justPocketed) {
      setCoins((prev) => [
        ...prev,
        { x: BOARD_SIZE * 0.5, y: BOARD_SIZE * 0.5, color: 'red', id: 'queen', vx: 0, vy: 0 },
      ]);
      setPocketed((prev) => prev.filter((p) => !(p.color === 'red' && p.player === turn)));
      setMessage(`Player ${turn + 1} must cover the queen!`);
      setTimeout(() => setMessage(''), 1300);
    }

    setTimeout(() => {
      if (!justPocketed) {
        setTurn((t) => getNextPlayerIdx(players, t));
        setMessage(`Player ${getNextPlayerIdx(players, turn) + 1}, position the striker!`);
      } else {
        setMessage(`Player ${turn + 1}, go again!`);
      }
    }, 340);
  };

  useEffect(() => {
    if (setup || moving || coins.length === 0 || players[turn].type !== 1) return;
    setTimeout(() => {
      const targetCoin = coins.reduce((closest, coin) => {
        const dist = distance(coin.x, coin.y, striker.x, striker.y);
        return dist < closest.dist ? { coin, dist } : closest;
      }, { coin: coins[0], dist: Infinity }).coin;
      const nearestPocket = POCKETS.reduce((closest, pkt) => {
        const dist = distance(targetCoin.x, targetCoin.y, pkt.x, pkt.y);
        return dist < closest.dist ? { pkt, dist } : closest;
      }, { pkt: POCKETS[0], dist: Infinity }).pkt;
      const ax = targetCoin.x + (nearestPocket.x - targetCoin.x) * 0.5 + (Math.random() - 0.5) * 10;
      const ay = targetCoin.y + (nearestPocket.y - targetCoin.y) * 0.5 - 30;
      shootStriker(ax, ay, 60 + Math.random() * 30);
    }, 650);
  }, [turn, moving, setup, coins.length, players]);

  let endMsg = null;
  if (coins.length === 0) {
    const max = Math.max(...players.map((p) => p.score));
    const winners = players.filter((p) => p.score === max);
    endMsg = winners.length > 1
      ? `Draw! (${winners.map((p) => `Player ${p.id + 1}`).join(', ')})`
      : `Player ${winners[0].id + 1} wins!`;
  }

  const resetGame = () => {
    setSetup(true);
    setPlayerCount(2);
    setPlayerTypes([0, 0, 0, 0]);
    setMessage('');
  };

  if (setup) {
    const colors = genPlayerColors(playerCount);
    return (
      <Box className="carrom-setup-outer">
        <Box className="carrom-setup-box">
          <Typography variant="h5" gutterBottom>
            Carrom Setup
          </Typography>
          <Box sx={{ mb: 2, mt: 1 }}>
            Players:{' '}
            <Select value={playerCount} onChange={handleCountChange} size="small">
              {[2, 3, 4].map((n) => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </Select>
          </Box>
          {Array.from({ length: playerCount }).map((_, i) => (
            <Box key={i} className="carrom-setup-row">
              <Box className="carrom-setup-circle" sx={{ background: colors[i], borderColor: '#c69e58' }} />
              <Typography sx={{ color: '#3a2518', fontWeight: 600, width: 50 }}>
                Player {i + 1}
              </Typography>
              <Select
                value={playerTypes[i]}
                onChange={(e) => handleSetupChange(i, e.target.value)}
                size="small"
                className="carrom-setup-type"
              >
                {PLAYER_TYPES.map((pt, j) => (
                  <MenuItem key={pt.label} value={j}>{pt.label}</MenuItem>
                ))}
              </Select>
              <Typography sx={{ ml: 1, color: playerTypes[i] === 0 ? '#228' : '#a13' }}>
                {PLAYER_TYPES[playerTypes[i]].icon}
              </Typography>
            </Box>
          ))}
          <Button variant="contained" onClick={startGame} sx={{ mt: 2 }}>
            Start Game
          </Button>
        </Box>
      </Box>
    );
  }

  const colors = genPlayerColors(players.length);

  return (
    <Box className="carrom-mainwrap">
      {message && (
        <Alert
          severity={message.includes('wins') ? 'success' : message.includes('fouled') ? 'error' : 'info'}
          sx={{ mb: 2 }}
        >
          {message}
        </Alert>
      )}
      <Box className="carrom-player-bar">
        {players.map((p, i) => {
          const pocketStats = pocketSummary(pocketed, i);
          return (
            <Box
              key={i}
              className={`carrom-player-cell ${turn === i ? 'carrom-player-active' : ''}`}
            >
              <Typography className="cidx" sx={{ color: colors[i] }}>
                P{i + 1}{p.type === 1 ? ' 🤖' : ''}
              </Typography>
              <Typography className="ccol" sx={{ color: '#f9f9f9', background: '#443c3a' }} title="Black">●</Typography>
              <Typography className="cnum">{pocketStats.black}</Typography>
              <Typography className="ccol" sx={{ color: '#f2be27', background: '#000' }} title="White">●</Typography>
              <Typography className="cnum">{pocketStats.white}</Typography>
              <Typography className="ccol" sx={{ color: '#e13c23' }} title="Red">●</Typography>
              <Typography className="cnum">{pocketStats.red}</Typography>
              <Typography className="ctotal">Total: {p.score}</Typography>
              {turn === i && <Typography className="cnow">⬅</Typography>}
            </Box>
          );
        })}
      </Box>
      <Box className="carrom-outer">
        <Box className="carrom-header">
          <Button variant="contained" onClick={resetGame}>Restart</Button>
        </Box>
        <Box className="carrom-board-ctr">
          <Box className="carrom-board-wrap" sx={{ width: screen, height: screen }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
              width={screen}
              height={screen}
              className="carrom-svg"
              onMouseMove={dragging ? handleStrikerDrag : undefined}
              onTouchMove={dragging ? handleStrikerDrag : undefined}
            >
              <rect x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} rx="32" fill="#fbf1de" stroke="#9e794a" strokeWidth="14" />
              <rect x={22} y={22} width={BOARD_SIZE - 44} height={BOARD_SIZE - 44} rx="11" fill="none" stroke="#875f32" strokeWidth="3" />
              <circle cx={BOARD_SIZE / 2} cy={BOARD_SIZE / 2} r={23} fill="#ffe7c6" stroke="#7d6041" strokeWidth="3" />
              <line x1="27" y1="27" x2={BOARD_SIZE - 27} y2={BOARD_SIZE - 27} stroke="#9e794a" strokeWidth="1.5" />
              <line x1="27" y1={BOARD_SIZE - 27} x2={BOARD_SIZE - 27} y2="27" stroke="#9e794a" strokeWidth="1.5" />
              {POCKETS.map((pkt, i) => (
                <circle key={i} cx={pkt.x} cy={pkt.y} r={POCKET_RADIUS} fill="#3b2c10" opacity="0.92" />
              ))}
              {coins.map((coin) => (
                <circle
                  key={coin.id}
                  cx={coin.x}
                  cy={coin.y}
                  r={COIN_RADIUS}
                  fill={coin.color === 'red' ? '#e13c23' : coin.color === 'black' ? '#443c3a' : '#fff9ed'}
                  stroke="#000"
                  strokeWidth={coin.color === 'red' ? 2.2 : 1.05}
                  opacity={coin.color === 'red' ? 0.91 : 1}
                  className={moving ? 'carrom-coin-moving' : ''}
                />
              ))}
              <circle
                cx={striker.x}
                cy={striker.y}
                r={STRIKER_RADIUS}
                fill={colors[turn]}
                stroke="#1b1410"
                strokeWidth="2.5"
                opacity="0.97"
                onMouseDown={moving || players[turn].type === 1 ? undefined : () => setDragging(true)}
                onTouchStart={moving || players[turn].type === 1 ? undefined : () => setDragging(true)}
                style={{ cursor: moving || players[turn].type === 1 ? 'wait' : 'ew-resize' }}
                className={moving ? 'carrom-striker-moving' : ''}
              />
              {dragging && aim && (
                <line
                  x1={striker.x}
                  y1={striker.y}
                  x2={aim.x}
                  y2={aim.y}
                  stroke="#009700"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                />
              )}
            </svg>
            {!moving && players[turn].type === 0 && (
              <Box
                className="carrom-aimzone"
                sx={{ width: screen, height: 90, top: screen - 90 }}
                onMouseDown={handleAimStart}
                onMouseMove={dragging ? handleAimMove : undefined}
                onMouseUp={handleAimEnd}
                onMouseLeave={handleAimEnd}
                onTouchStart={handleAimStart}
                onTouchMove={dragging ? handleAimMove : undefined}
                onTouchEnd={handleAimEnd}
              >
                <Typography className="carrom-flickmsg">
                  {dragging ? 'Flick Up to Shoot' : 'Drag to Aim, Flick Up!'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        {!moving && players[turn].type === 0 && (
          <Box className="carrom-power-row">
            <Box
              sx={{
                width: 210,
                background: '#fffbe5',
                padding: '6px 20px 2px 20px',
                borderRadius: 18,
                boxShadow: '0 2px 7px #8b7d497a',
                margin: '18px auto 6px auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Typography fontSize="1em" fontWeight={600}>Strike Power</Typography>
              <Slider
                min={10}
                max={100}
                value={strikePower}
                onChange={(_, val) => setStrikePower(val)}
                size="small"
                sx={{ width: 140, mx: 'auto', color: '#dd981d' }}
              />
              <Typography sx={{ fontSize: '0.97em', mt: -0.7, letterSpacing: 0.5, color: '#666' }}>
                Drag from striker: farther = more power!
              </Typography>
            </Box>
          </Box>
        )}
        <Box className="carrom-msg">
          {endMsg ? (
            <Typography variant="h6">{endMsg}</Typography>
          ) : (
            <>
              <Typography sx={{ color: colors[turn], fontWeight: 600 }}>
                {players[turn].type === 1 ? 'Bot ' : 'Player '}{turn + 1}'s turn
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: '1em' }}>
                <span style={{ color: '#e13c23' }}>Red</span>+3,{' '}
                <span style={{ color: '#443c3a', fontWeight: 500 }}>Black</span>+1,{' '}
                <span style={{ color: '#fff9ed', background: '#443c3a', borderRadius: 6, padding: '0 0.36em' }}>
                  White
                </span>+1
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default CarromBoard;