import React from "react";
import { useNavigate } from "react-router-dom";
import "./GameCard.css";
import Icon from "@mui/icons-material/Games"; // Default icon
// Or import each icon dynamically if you use specific ones

const GameCard = ({ name, route, description, icon: IconComp }) => {
  const navigate = useNavigate();
  return (
    <div className="game-card" onClick={() => navigate(`/${route}`)}>
      <div className="game-icon">{IconComp ? <IconComp fontSize="large" /> : <Icon fontSize="large" />}</div>
      <h3 className="game-title">{name}</h3>
      <div className="game-desc">{description}</div>
    </div>
  );
};

export default GameCard;
