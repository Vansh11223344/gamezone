import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  Alert,
  IconButton,
} from '@mui/material';
import { Undo, Redo, Refresh, Delete } from '@mui/icons-material';
import './Sudoku.css';

// Sudoku size configurations
const SUDOKU_SIZES = [
  { label: '4x4', size: 4, box: 2 },
  { label: '9x9', size: 9, box: 3 },
];

// Generate a Sudoku puzzle and its solution
function generateSudoku(size, boxSize) {
  // Create a solved grid via recursive backtracking
  function fillSudoku(grid, r = 0, c = 0) {
    if (r === size) return true;
    if (grid[r][c] !== 0)
      return fillSudoku(
        grid,
        c + 1 === size ? r + 1 : r,
        c + 1 === size ? 0 : c + 1
      );
    let nums = [...Array(size).keys()].map((v) => v + 1);
    for (let i = nums.length - 1; i > 0; --i) {
      let j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    for (let n of nums) {
      if (isValid(grid, r, c, n, size, boxSize)) {
        grid[r][c] = n;
        if (
          fillSudoku(
            grid,
            c + 1 === size ? r + 1 : r,
            c + 1 === size ? 0 : c + 1
          )
        )
          return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  // Remove cells to create a puzzle
  function removeCells(grid) {
    let attempts = size === 9 ? 40 : 8; // Cells to remove
    let puzzle = grid.map((row) => [...row]);
    while (attempts > 0) {
      let r = Math.floor(Math.random() * size);
      let c = Math.floor(Math.random() * size);
      if (puzzle[r][c] !== 0) {
        puzzle[r][c] = 0;
        attempts--;
      }
    }
    return puzzle;
  }

  let grid = Array(size)
    .fill(0)
    .map(() => Array(size).fill(0));
  fillSudoku(grid);
  return { puzzle: removeCells(grid), solution: grid };
}

// Validate a move
function isValid(grid, row, col, val, size, boxSize) {
  for (let i = 0; i < size; ++i) {
    if (grid[row][i] === val || grid[i][col] === val) return false;
  }
  let br = Math.floor(row / boxSize) * boxSize;
  let bc = Math.floor(col / boxSize) * boxSize;
  for (let r = br; r < br + boxSize; ++r) {
    for (let c = bc; c < bc + boxSize; ++c) {
      if (grid[r][c] === val) return false;
    }
  }
  return true;
}

// Check if two grids are equal
function deepEqual(a, b) {
  return a.every((row, r) => row.every((cell, c) => cell === b[r][c]));
}

function Sudoku() {
  const [sizeObj, setSizeObj] = useState(SUDOKU_SIZES[1]); // Default 9x9
  const [puzzle, setPuzzle] = useState([]);
  const [solution, setSolution] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [errorMap, setErrorMap] = useState([]);
  const [selected, setSelected] = useState([0, 0]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [message, setMessage] = useState('');
  const boardRef = useRef(null);

  // Generate new puzzle on size change
  useEffect(() => {
    generateNewPuzzle();
    // eslint-disable-next-line
  }, [sizeObj]);

  const generateNewPuzzle = () => {
    const { puzzle, solution } = generateSudoku(sizeObj.size, sizeObj.box);
    setPuzzle(puzzle);
    setSolution(solution);
    setUserInput(puzzle.map((row) => [...row]));
    setErrorMap(puzzle.map((row) => Array(row.length).fill(false)));
    setHistory([]);
    setRedoStack([]);
    setSelected([0, 0]);
    setMessage('');
  };

  const setCell = (r, c, val) => {
    if (puzzle[r][c] !== 0) return;
    const newInput = userInput.map((row) => [...row]);
    newInput[r][c] = val;
    const newError = errorMap.map((row) => [...row]);
    newError[r][c] = val !== 0 && val !== solution[r][c];

    setHistory([...history, userInput.map((row) => [...row])]);
    setRedoStack([]);
    setUserInput(newInput);
    setErrorMap(newError);

    if (deepEqual(newInput, solution)) {
      setMessage('Solved! 🎉');
    } else if (val !== 0 && newError[r][c]) {
      setMessage('Incorrect move!');
    } else {
      setMessage('');
    }
  };

  const handleCellClick = (r, c) => {
    setSelected([r, c]);
    boardRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    const validKeys = ['Backspace', 'Delete', '0', ...Array(sizeObj.size).keys().map(String)];
    if (!validKeys.includes(e.key)) return;
    const [r, c] = selected;
    if (puzzle[r][c] !== 0) return;
    const val = e.key === 'Backspace' || e.key === 'Delete' || e.key === '0' ? 0 : parseInt(e.key);
    setCell(r, c, val);
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setRedoStack([...redoStack, userInput.map((row) => [...row])]);
    setUserInput(last);
    setHistory(history.slice(0, -1));
    const err = last.map((row, rIdx) =>
      row.map((cell, cIdx) => cell !== 0 && cell !== solution[rIdx][cIdx])
    );
    setErrorMap(err);
    setMessage('');
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory([...history, userInput.map((row) => [...row])]);
    setUserInput(next);
    setRedoStack(redoStack.slice(0, -1));
    const err = next.map((row, rIdx) =>
      row.map((cell, cIdx) => cell !== 0 && cell !== solution[rIdx][cIdx])
    );
    setErrorMap(err);
    setMessage('');
  };

  // Keyboard events scoped to the board
  useEffect(() => {
    const board = boardRef.current;
    if (board) {
      board.addEventListener('keydown', handleKeyDown);
      return () => board.removeEventListener('keydown', handleKeyDown);
    }
    // eslint-disable-next-line
  }, [selected, puzzle, userInput, sizeObj]);

  return (
    <div className="sudoku-bg">
      <div className="sudoku-center-outer">
        <Box className="sudoku-outer">
          <Typography variant="h4" gutterBottom>
            Sudoku
          </Typography>
          {message && (
            <Alert severity={message.includes('Solved') ? 'success' : 'error'} sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}
          <Box className="sudoku-toolbar gamecard-toolbar">
            <Select
              value={sizeObj.size}
              onChange={(e) =>
                setSizeObj(SUDOKU_SIZES.find((s) => s.size === parseInt(e.target.value)))
              }
              size="small"
              sx={{ mr: 2 }}
            >
              {SUDOKU_SIZES.map((s) => (
                <MenuItem key={s.size} value={s.size}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={generateNewPuzzle}
              sx={{ mr: 2 }}
            >
              New Game
            </Button>
            <IconButton
              onClick={undo}
              disabled={!history.length}
              color="primary"
              aria-label="undo"
            >
              <Undo />
            </IconButton>
            <IconButton
              onClick={redo}
              disabled={!redoStack.length}
              color="primary"
              aria-label="redo"
            >
              <Redo />
            </IconButton>
          </Box>
          <Box
            className="sudoku-board"
            style={{
              gridTemplateColumns: `repeat(${sizeObj.size}, 40px)`,
              gridTemplateRows: `repeat(${sizeObj.size}, 40px)`,
            }}
            ref={boardRef}
            tabIndex={0}
          >
            {userInput.map((row, r) =>
              row.map((cell, c) => (
                <Box
                  key={`${r}x${c}`}
                  className={`sudoku-cell ${
                    puzzle[r][c] === 0 ? 'sudoku-editable' : ''
                  } ${selected[0] === r && selected[1] === c ? 'sudoku-selected' : ''} ${
                    errorMap[r][c] ? 'sudoku-error' : ''
                  }`}
                  onClick={() => handleCellClick(r, c)}
                  sx={{
                    borderRight:
                      (c + 1) % sizeObj.box === 0 && c !== sizeObj.size - 1
                        ? '3px solid #1976d2'
                        : '1px solid #ccc',
                    borderBottom:
                      (r + 1) % sizeObj.box === 0 && r !== sizeObj.size - 1
                        ? '3px solid #1976d2'
                        : '1px solid #ccc',
                  }}
                >
                  {cell !== 0 ? cell : ''}
                </Box>
              ))
            )}
          </Box>
          <Box className="sudoku-num-pad gamecard-num-pad">
            {[...Array(sizeObj.size).keys()].map((n) => (
              <Button
                key={n + 1}
                className="sudoku-num"
                onClick={() => {
                  const [r, c] = selected;
                  setCell(r, c, n + 1);
                }}
                variant="outlined"
                sx={{ minWidth: '40px', m: 0.5 }}
              >
                {n + 1}
              </Button>
            ))}
            <Button
              className="sudoku-num gamecard-erase"
              onClick={() => {
                const [r, c] = selected;
                setCell(r, c, 0);
              }}
              variant="outlined"
              startIcon={<Delete />}
              sx={{ minWidth: '80px', m: 0.5 }}
            >
              Erase
            </Button>
          </Box>
          <Typography variant="body2" color="textSecondary" className="sudoku-footer gamecard-footer" sx={{ mt: 2 }}>
            Click a cell and use the number pad or type 1-{sizeObj.size}.{' '}
            <span style={{ color: 'red', fontWeight: 700 }}>Red</span> cells are incorrect.
          </Typography>
        </Box>
      </div>
    </div>
  );
}

export default Sudoku;
