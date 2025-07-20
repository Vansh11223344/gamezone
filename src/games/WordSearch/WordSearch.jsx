import React, { useRef, useEffect, useState } from "react";
import "./WordSearch.css";

// Grid setup
const GRID_SIZE = 10;
const WORDS = ["REACT", "JAVASCRIPT", "COMPONENT", "STATE", "HOOK", "THEME", "CSS", "GAME", "LOGIC", "PUZZLE"];
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIRS = [
  [0, 1],     // right
  [1, 0],     // down
  [1, 1],     // down-right
  [-1, 1],    // up-right
  [0, -1],    // left
  [-1, 0],    // up
  [-1, -1],   // up-left
  [1, -1],    // down-left
];

// 1. Place words on grid, fill remaining with random letters
function makeGrid(size, words) {
  let grid = Array.from({ length: size }, () => Array(size).fill(""));
  let positions = {};
  for (let word of words) {
    let placed = false, attempts = 0;
    while (!placed && attempts++ < 300) {
      let dir = DIRS[Math.floor(Math.random() * DIRS.length)];
      let r = Math.floor(Math.random() * size), c = Math.floor(Math.random() * size);
      let len = word.length, rr = r, cc = c;
      // Check fits
      let ok = true;
      for (let l = 0; l < len; l++) {
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) { ok = false; break; }
        let letter = grid[rr][cc];
        if (letter && letter !== word[l]) { ok = false; break; }
        rr += dir[0]; cc += dir[1];
      }
      if (!ok) continue;
      // Place
      rr = r; cc = c;
      let cells = [];
      for (let l = 0; l < len; l++) {
        grid[rr][cc] = word[l];
        cells.push([rr, cc]);
        rr += dir[0]; cc += dir[1];
      }
      positions[word] = cells;
      placed = true;
    }
    // fallback: skip if can't place, rare
  }
  // Fill blanks with randoms
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (!grid[r][c]) grid[r][c] = ALPHA[Math.floor(Math.random() * ALPHA.length)];
  }
  return { grid, positions };
}

// 2. Check if two points are a straight direction (one of allowed 8)
function getDirection([r1, c1], [r2, c2]) {
  let dr = r2 - r1, dc = c2 - c1;
  if (dr !== 0) dr = dr / Math.abs(dr);
  if (dc !== 0) dc = dc / Math.abs(dc);
  return [dr, dc];
}
function sameLine([r1, c1], [r2, c2]) {
  let dr = Math.abs(r1 - r2), dc = Math.abs(c1 - c2);
  return dr === 0 || dc === 0 || dr === dc;
}
function cellsBetween([r1,c1],[r2,c2]) {
  let dir = getDirection([r1,c1],[r2,c2]);
  let len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
  return Array.from({length:len+1}, (_,i)=>[r1+dir[0]*i, c1+dir[1]*i]);
}

export default function WordSearch() {
  const [{grid, positions}, setGridState] = useState(() => makeGrid(GRID_SIZE, WORDS));
  const [found, setFound] = useState([]);
  const [select, setSelect] = useState(null);
  const [highlight, setHighlight] = useState([]);
  const [complete, setComplete] = useState(false);

  function restart() {
    setGridState(makeGrid(GRID_SIZE, WORDS));
    setFound([]); setSelect(null); setHighlight([]); setComplete(false);
  }

  // Selection Logic
  function startSel(r, c) {
    setSelect({from: [r, c], to: [r, c], active: true});
    setHighlight([[r, c]]);
  }
  function moveSel(r, c) {
    if (!select || !select.active) return;
    if (!sameLine(select.from, [r, c])) return;
    setSelect(s => ({...s, to: [r, c]}));
    setHighlight(cellsBetween(select.from, [r, c]));
  }
  function endSel() {
    if (!select || !highlight || highlight.length < 2) { setSelect(null); setHighlight([]); return; }
    // Read word in order
    let chars = highlight.map(([r, c]) => grid[r][c]).join("");
    let charsRev = highlight.map(([r,c])=>grid[r][c]).reverse().join("");
    let match = WORDS.find(w => 
      (!found.includes(w)) && 
      (w === chars || w === charsRev)
    );
    if (match) {
      setFound(f => [...f, match]);
      if (found.length+1 === WORDS.length) setComplete(true);
    }
    setSelect(null);
    setHighlight([]);
  }

  // Touch handlers
  const gridRef = useRef();
  // find closest cell to client X/Y
  function cellAtClient(ev) {
    let rect = gridRef.current.getBoundingClientRect();
    let tX = ev.touches[0].clientX, tY = ev.touches[0].clientY;
    let cellW = rect.width / GRID_SIZE, cellH = rect.height / GRID_SIZE;
    let c = Math.floor((tX - rect.left) / cellW);
    let r = Math.floor((tY - rect.top) / cellH);
    if (r<0||r>=GRID_SIZE||c<0||c>=GRID_SIZE) return null;
    return [r,c];
  }

  function handleTouchStart(e) {
    let cell = cellAtClient(e);
    if(cell) startSel(...cell);
  }
  function handleTouchMove(e) {
    let cell = cellAtClient(e);
    if(cell) moveSel(...cell);
  }
  function handleTouchEnd() {
    endSel();
  }

  return (
    <div className="ws-container">
      <h2 className="ws-title">WordSearch Puzzle</h2>
      <div className="ws-topinfo">
        <button className="ws-btn" onClick={restart}>New Puzzle</button>
        <span>Words remaining: {WORDS.length - found.length}</span>
      </div>
      <div
        className="ws-grid"
        ref={gridRef}
        style={{gridTemplateColumns: `repeat(${GRID_SIZE},1fr)`}}
        onMouseLeave={()=>{setSelect(null);setHighlight([]);}}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {grid.map((row, r) => row.map((ch, c) => {
          // Highlight styles for selecting or found words
          let isSel = highlight.some(([rr,cc])=>rr===r&&cc===c);
          let isFound = found.some(word => positions[word]?.some(([rr,cc])=>rr===r&&cc===c));
          return (
            <div
              key={r+"-"+c}
              className={"ws-cell"+(isSel ? " ws-sel" : "")+(isFound?" ws-found":"")}
              tabIndex={0}
              aria-label={ch}
              onMouseDown={()=>startSel(r,c)}
              onMouseEnter={e=>select?.active && moveSel(r,c)}
              onMouseUp={endSel}
            >
              {ch}
            </div>
          );
        }))}
      </div>
      <div className="ws-words">
        {WORDS.map(w =>
          <span
            key={w}
            className={
              "ws-word"
              +(found.includes(w) ? " ws-word-found" : "")
              +(select&&highlight.length > 0 && (w===highlight.map(([r,c])=>grid[r][c]).join("") || w===highlight.map(([r,c])=>grid[r][c]).reverse().join("")) ? " ws-word-hl" : "")
            }
          >{w}</span>
        )}
      </div>
      {complete && <div className="ws-congrats">🎉 You found all the words! 🎉 <button className="ws-btn" onClick={restart}>Play Again</button></div>}
    </div>
  );
}
