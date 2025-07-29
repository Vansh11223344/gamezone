import React, { useState, useEffect } from "react";
import GameCard from "./GameCard";
import "./GameGrid.css";

const GameGrid = ({ games }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Show loading for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h1 className="loading-text">Play Games</h1>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="galaxy-container">
      <div className="stars-layer">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className={`star star-${(i % 3) + 1}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
      <div className="nebula-layer">
        <div className="nebula nebula-1"></div>
        <div className="nebula nebula-2"></div>
        <div className="nebula nebula-3"></div>
      </div>
      <div className="game-grid">
        {games.map(game => (
          <GameCard key={game.route} {...game} />
        ))}
      </div>
    </div>
  );
};

export default GameGrid;