import React from "react";
import "./Minesweeper.css";

const BOARD_HEIGHT = 8;
const BOARD_WIDTH = 8;
const MINES = 10;

// Helper functions
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function createEmptyBoard(height, width) {
  return Array.from({ length: height }, (_, x) =>
    Array.from({ length: width }, (_, y) => ({
      x,
      y,
      isMine: false,
      neighbour: 0,
      isRevealed: false,
      isEmpty: false,
      isFlagged: false,
    }))
  );
}

function plantMines(data, height, width, mines) {
  let minesPlanted = 0;
  while (minesPlanted < mines) {
    const x = getRandomInt(height);
    const y = getRandomInt(width);
    if (!data[x][y].isMine) {
      data[x][y].isMine = true;
      minesPlanted++;
    }
  }
  return data;
}

function traverseNeighbours(x, y, data, height, width) {
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], /*X,Y*/ [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];
  return directions
    .map(([dx, dy]) => data[x + dx]?.[y + dy])
    .filter(Boolean);
}

function calculateNeighbours(data, height, width) {
  for (let x = 0; x < height; x++) {
    for (let y = 0; y < width; y++) {
      if (!data[x][y].isMine) {
        const neighbours = traverseNeighbours(x, y, data, height, width);
        const count = neighbours.filter(cell => cell.isMine).length;
        data[x][y].neighbour = count;
        data[x][y].isEmpty = count === 0;
      }
    }
  }
  return data;
}

function revealEmpty(x, y, data, height, width) {
  const queue = [[x, y]];
  while (queue.length) {
    const [cx, cy] = queue.pop();
    traverseNeighbours(cx, cy, data, height, width).forEach(cell => {
      if (!cell.isRevealed && !cell.isFlagged) {
        data[cell.x][cell.y].isRevealed = true;
        if (cell.isEmpty) queue.push([cell.x, cell.y]);
      }
    });
  }
  return data;
}

function getHiddenCells(data) {
  return data.flat().filter(cell => !cell.isRevealed);
}

function getFlags(data) {
  return data.flat().filter(cell => cell.isFlagged);
}

function getMines(data) {
  return data.flat().filter(cell => cell.isMine);
}

function initBoard(height, width, mines) {
  let data = createEmptyBoard(height, width);
  data = plantMines(data, height, width, mines);
  data = calculateNeighbours(data, height, width);
  return data;
}

// Cell component
function Cell({ value, onClick, onContextMenu }) {
  let className = "cell";
  if (value.isRevealed) {
    className += " revealed";
    if (value.isEmpty) className += " empty";
    if (value.isMine) className += " mine";
  }
  if (value.isFlagged && !value.isRevealed) className += " flagged";

  // Add data attribute for numbers 1-8 (only if revealed and not mine and neighbour>0)
  const dataNumber = value.isRevealed && !value.isMine && value.neighbour > 0
    ? value.neighbour
    : undefined;

  return (
    <div
      className={className}
      data-number={dataNumber}
      onClick={onClick}
      onContextMenu={onContextMenu}
      tabIndex={0}
      role="button"
      aria-label={
        value.isFlagged
          ? "Flagged cell"
          : value.isRevealed && value.isMine
          ? "Mine"
          : value.isRevealed
          ? `${value.neighbour || 'Empty'} adjacent mines`
          : "Hidden cell"
      }
    >
      {!value.isRevealed && value.isFlagged && "🚩"}
      {value.isRevealed && value.isMine && "💣"}
      {value.isRevealed && !value.isMine && value.neighbour > 0 && value.neighbour}
      {/* empty revealed cells show nothing */}
    </div>
  );
}


// Board component
class Board extends React.Component {
  state = {
    boardData: initBoard(this.props.height, this.props.width, this.props.mines),
    mineCount: this.props.mines,
    gameStatus: "",
  };

  handleCellClick = (x, y) => {
    let boardData = this.state.boardData.slice();
    const cell = boardData[x][y];
    if (cell.isRevealed || cell.isFlagged || this.state.gameStatus) return;

    if (cell.isMine) {
      // Game over!
      boardData = boardData.map(row =>
        row.map(c => ({ ...c, isRevealed: c.isMine ? true : c.isRevealed }))
      );
      this.setState({ boardData, gameStatus: "💥 You lost!" });
      return;
    }

    boardData[x][y].isRevealed = true;
    if (cell.isEmpty) boardData = revealEmpty(x, y, boardData, this.props.height, this.props.width);

    // Win condition
    const hiddenCells = getHiddenCells(boardData);
    if (hiddenCells.length === this.props.mines) {
      // All non-mines revealed!
      boardData = boardData.map(row =>
        row.map(c =>
          c.isMine ? { ...c, isFlagged: true } : c
        )
      );
      this.setState({
        boardData,
        mineCount: 0,
        gameStatus: "🎉 You win!"
      });
      return;
    }

    this.setState({
      boardData,
      mineCount: this.props.mines - getFlags(boardData).length,
    });
  };

  handleCellRightClick = (e, x, y) => {
    e.preventDefault();
    let boardData = this.state.boardData.slice();
    if (this.state.gameStatus) return;

    const cell = boardData[x][y];
    if (cell.isRevealed) return;

    cell.isFlagged = !cell.isFlagged;

    // Check win by flagging
    let gameStatus = this.state.gameStatus;
    let mineCount = this.props.mines - getFlags(boardData).length;

    if (mineCount === 0) {
      const allFlags = getFlags(boardData);
      const allMines = getMines(boardData);
      if (
        allFlags.length === allMines.length &&
        allFlags.every(flag => flag.isMine)
      ) {
        gameStatus = "🎉 You win!";
        boardData = boardData.map(row =>
          row.map(c => (c.isFlagged || c.isMine ? { ...c, isRevealed: true } : c))
        );
        mineCount = 0;
      }
    }
    this.setState({ boardData, mineCount, gameStatus });
  };

  resetBoard = () => {
    this.setState({
      boardData: initBoard(this.props.height, this.props.width, this.props.mines),
      mineCount: this.props.mines,
      gameStatus: "",
    });
  };

  render() {
    const { boardData, mineCount, gameStatus } = this.state;
    return (
      <div className="minesweeper-container">
        <h2 className="title">Minesweeper</h2>
        <div className="toolbar">
          <span>Mines: {mineCount}</span>
          <button className="reset-btn" onClick={this.resetBoard}>Restart</button>
          {gameStatus && <span className="status">{gameStatus}</span>}
        </div>
        <div
          className="board"
          style={{
            gridTemplateRows: `repeat(${this.props.height}, 1fr)`,
            gridTemplateColumns: `repeat(${this.props.width}, 1fr)`
          }}
        >
          {boardData.map((row, x) =>
            row.map((cell, y) => (
              <Cell
                key={`${x}-${y}`}
                value={cell}
                onClick={() => this.handleCellClick(x, y)}
                onContextMenu={(e) => this.handleCellRightClick(e, x, y)}
              />
            ))
          )}
        </div>
      </div>
    );
  }
}

// Game root
export default function Game() {
  return <Board height={BOARD_HEIGHT} width={BOARD_WIDTH} mines={MINES} />;
}
