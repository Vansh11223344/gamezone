import React from "react";
import GameCard from "./GameCard";
import "./GameGrid.css";

const GameGrid = ({ games }) => (
  <div className="game-grid">
    {games.map(game => (
      <GameCard key={game.route} {...game} />
    ))}
  </div>
);

export default GameGrid;
