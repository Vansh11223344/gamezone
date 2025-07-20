import React, { useState, useRef, useEffect } from "react";
import "./RushHour.css";

const GRID_SIZE = 6; // 6x6 board

// Initial cars configuration (id, row, col, length, orientation(horizontal?), color, isMainCar)
const INITIAL_CARS = [
  { id: "X", row: 2, col: 1, len: 2, horizontal: true, color: "#d32f2f", isMain: true }, // The red car
  { id: "A", row: 0, col: 0, len: 2, horizontal: true, color: "#1976d2" },
  { id: "B", row: 0, col: 3, len: 3, horizontal: false, color: "#fbc02d" },
  { id: "C", row: 1, col: 2, len: 2, horizontal: false, color: "#388e3c" },
  { id: "D", row: 2, col: 4, len: 2, horizontal: false, color: "#7b1fa2" },
  { id: "E", row: 3, col: 0, len: 3, horizontal: true, color: "#f57c00" },
  { id: "F", row: 4, col: 1, len: 2, horizontal: false, color: "#0097a7" },
  { id: "G", row: 5, col: 2, len: 3, horizontal: true, color: "#455a64" },
];

const COLORS = ["#1976d2", "#fbc02d", "#388e3c", "#7b1fa2", "#f57c00", "#0097a7", "#455a64"];

function cloneCars(cars) {
  return cars.map(car => ({ ...car }));
}
function makeOccupiedGrid(cars) {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  cars.forEach(car => {
    for (let i = 0; i < car.len; i++) {
      const r = car.row + (car.horizontal ? 0 : i);
      const c = car.col + (car.horizontal ? i : 0);
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) grid[r][c] = car.id;
    }
  });
  return grid;
}
function canPlaceCar(car, grid) {
  for (let i = 0; i < car.len; i++) {
    const r = car.row + (car.horizontal ? 0 : i);
    const c = car.col + (car.horizontal ? i : 0);
    if (r >= GRID_SIZE || c >= GRID_SIZE || r < 0 || c < 0 || grid[r][c] !== null) {
      return false;
    }
  }
  return true;
}
function canMoveCar(car, cars, dir) {
  const grid = makeOccupiedGrid(cars);
  if (car.horizontal) {
    if (dir > 0) {
      const newPos = car.col + car.len;
      if (newPos >= GRID_SIZE) return false;
      return grid[car.row][newPos] === null;
    } else {
      const newPos = car.col - 1;
      if (newPos < 0) return false;
      return grid[car.row][newPos] === null;
    }
  } else {
    if (dir > 0) {
      const newPos = car.row + car.len;
      if (newPos >= GRID_SIZE) return false;
      return grid[newPos][car.col] === null;
    } else {
      const newPos = car.row - 1;
      if (newPos < 0) return false;
      return grid[newPos][car.col] === null;
    }
  }
}
function moveCar(car, cars, dir) {
  const newCars = cars.map(c => {
    if (c.id === car.id) {
      if (c.horizontal) {
        return { ...c, col: c.col + dir };
      } else {
        return { ...c, row: c.row + dir };
      }
    }
    return c;
  });
  return newCars;
}
function checkVictory(cars) {
  const mainCar = cars.find(c => c.isMain);
  if (!mainCar) return false;
  return mainCar.horizontal && mainCar.row === 2 && (mainCar.col + mainCar.len === GRID_SIZE);
}
function generateNewConfig() {
  const newCars = [];
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  // Place main red car (always horizontal, row 2, random col)
  const mainCol = Math.floor(Math.random() * (GRID_SIZE - 2)); // len=2, so col 0 to 4
  const mainCar = { id: "X", row: 2, col: mainCol, len: 2, horizontal: true, color: "#d32f2f", isMain: true };
  for (let i = 0; i < mainCar.len; i++) grid[mainCar.row][mainCar.col + i] = mainCar.id;
  newCars.push(mainCar);
  // Place additional cars
  const numCars = 6;
  let colorIndex = 0;
  for (let i = 0; i < numCars; i++) {
    let attempts = 0;
    const maxAttempts = 50;
    let placed = false;
    while (attempts < maxAttempts && !placed) {
      const len = Math.random() < 0.5 ? 2 : 3;
      const horizontal = Math.random() < 0.5;
      const maxRow = horizontal ? GRID_SIZE - 1 : GRID_SIZE - len;
      const maxCol = horizontal ? GRID_SIZE - len : GRID_SIZE - 1;
      if (maxRow < 0 || maxCol < 0) { attempts++; continue; }
      const row = Math.floor(Math.random() * (maxRow + 1));
      const col = Math.floor(Math.random() * (maxCol + 1));
      const car = {
        id: String.fromCharCode(65 + i),
        row, col, len, horizontal,
        color: COLORS[colorIndex % COLORS.length],
        isMain: false,
      };
      if (canPlaceCar(car, grid)) {
        for (let j = 0; j < car.len; j++) {
          const r = car.row + (car.horizontal ? 0 : j);
          const c = car.col + (car.horizontal ? j : 0);
          grid[r][c] = car.id;
        }
        newCars.push(car);
        placed = true; colorIndex++;
      }
      attempts++;
    }
    if (!placed) return cloneCars(INITIAL_CARS);
  }
  // Basic solvability check
  const tempGrid = makeOccupiedGrid(newCars);
  let canExit = true;
  for (let c = mainCar.col + mainCar.len; c < GRID_SIZE; c++) {
    if (tempGrid[2][c] !== null) { canExit = false; break; }
  }
  if (!canExit) return generateNewConfig();
  return newCars;
}

export default function RushHour() {
  const [cars, setCars] = useState(cloneCars(INITIAL_CARS));
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, startY: 0 });
  const boardRef = useRef();

  // Responsive cell size
  const [cellSize, setCellSize] = useState(80);
  useEffect(() => {
    function onResize() {
      if (boardRef.current) {
        const w = boardRef.current.offsetWidth;
        setCellSize(w / GRID_SIZE);
      }
    }
    window.addEventListener("resize", onResize);
    setTimeout(onResize, 60);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Select car to move
  const selectCar = (id) => { if (won) return; setSelected(id); };
  // Move selected car in direction (+1 or -1)
  const moveSelectedCar = (dir) => {
    if (won || !selected) return;
    const car = cars.find(c => c.id === selected);
    if (!car) return;
    if (canMoveCar(car, cars, dir)) {
      const newCars = moveCar(car, cars, dir);
      setCars(newCars);
      setMoves(m => m + 1);
      if (checkVictory(newCars)) setWon(true);
    }
  };
  // Handle keypress
  useEffect(() => {
    function handleKey(e) {
      if (won) return;
      if (!selected) return;
      const car = cars.find(c => c.id === selected);
      if (!car) return;
      if (car.horizontal) {
        if (e.key === "ArrowLeft") e.preventDefault(), moveSelectedCar(-1);
        if (e.key === "ArrowRight") e.preventDefault(), moveSelectedCar(1);
      } else {
        if (e.key === "ArrowUp") e.preventDefault(), moveSelectedCar(-1);
        if (e.key === "ArrowDown") e.preventDefault(), moveSelectedCar(1);
      }
      if (e.key === "r" || e.key === "R") e.preventDefault(), resetGame();
      if (e.key === "n" || e.key === "N") e.preventDefault(), nextGame();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected, cars, won]);
  // Drag events
  function onDragStart(e, car) {
    if (won) return;
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = { active: true, startX: clientX, startY: clientY, carId: car.id };
    setSelected(car.id);
  }
  function onDragMove(e) {
    if (!dragRef.current.active) return;
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    let deltaX = clientX - dragRef.current.startX;
    let deltaY = clientY - dragRef.current.startY;
    const car = cars.find(c => c.id === dragRef.current.carId);
    if (!car) return;
    const threshold = cellSize / 2; // Minimum drag for 1 step move
    if (car.horizontal) {
      if (deltaX > threshold) { moveSelectedCar(1); dragRef.current.startX = clientX; }
      else if (deltaX < -threshold) { moveSelectedCar(-1); dragRef.current.startX = clientX; }
    } else {
      if (deltaY > threshold) { moveSelectedCar(1); dragRef.current.startY = clientY; }
      else if (deltaY < -threshold) { moveSelectedCar(-1); dragRef.current.startY = clientY; }
    }
  }
  function onDragEnd() { dragRef.current.active = false; }

  // Reset & next
  function resetGame() { setCars(cloneCars(INITIAL_CARS)); setMoves(0); setWon(false); setSelected(null); }
  function nextGame() { setCars(cloneCars(generateNewConfig())); setMoves(0); setWon(false); setSelected(null); }

  return (
    <div className="rushhour-container">
      <h2 className="rushhour-title">Rush Hour</h2>
      <div className="rushhour-bar">
        <span>Moves: {moves}</span>
        <div className="rushhour-btn-group">
          <button className="rushhour-btn" onClick={resetGame}>Restart</button>
          <button className="rushhour-btn" onClick={nextGame}>Next</button>
        </div>
      </div>
      <div
        ref={boardRef}
        className="rushhour-board"
        style={{ "--cell-size": `${cellSize}px` }}
        onMouseMove={onDragMove}
        onTouchMove={onDragMove}
        onMouseUp={onDragEnd}
        onTouchEnd={onDragEnd}
        onMouseLeave={onDragEnd}
      >
        <div className="rushhour-exit" style={{
          top: `calc( var(--cell-size) * 2 )`,
          left: `calc( var(--cell-size) * 6 - var(--cell-size) / 2 )`,
          width: `calc( var(--cell-size) / 1.5 )`,
          height: `calc( var(--cell-size) * 2 )`,
        }}/>
        {cars.map(car => {
          const isSelected = car.id === selected;
          return (
            <div
              key={car.id}
              className={`rushhour-car${car.isMain ? " maincar" : ""}${isSelected ? " selected" : ""}`}
              style={{
                top: `calc(var(--cell-size) * ${car.row})`,
                left: `calc(var(--cell-size) * ${car.col})`,
                width: car.horizontal ? `calc(var(--cell-size) * ${car.len})` : `var(--cell-size)`,
                height: car.horizontal ? `var(--cell-size)` : `calc(var(--cell-size) * ${car.len})`,
                backgroundColor: car.color,
              }}
              onClick={() => selectCar(car.id)}
              onMouseDown={e => onDragStart(e, car)}
              onTouchStart={e => onDragStart(e, car)}
              tabIndex={0}
              aria-label={car.isMain ? "Your car" : "Car"}
            >
              {car.isMain && <span className="rushhour-maincar-front" />}
            </div>
          );
        })}
      </div>
      <div className="rushhour-controls">
        <p>
          Use arrow keys to move selected car, or drag with mouse/touch.<br/>
          Red car must reach the exit on right!
        </p>
      </div>
      {won && (
        <div className="rushhour-winbox">
          <p>🎉 You escaped in {moves} moves!</p>
          <button className="rushhour-btn" onClick={nextGame}>Next Puzzle</button>
          <button className="rushhour-btn" onClick={resetGame}>Play Again</button>
        </div>
      )}
      <div className="rushhour-footer">Classic Rush Hour Puzzle</div>
    </div>
  );
}
