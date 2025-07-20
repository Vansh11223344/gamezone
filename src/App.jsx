import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GameGrid from "./components/GameGrid";
import { games } from "./games/GamesList";
import "./App.css";

// Import all games as lazy-loaded pages
const gameComponents = {};
games.forEach(game =>
  gameComponents[game.route] = React.lazy(() => import(`./games/${game.folder}/${game.folder}.jsx`))
);

const App = () => (
  <Router>
    <React.Suspense fallback={<div className="loader">Loading...</div>}>
      <Routes>
        <Route path="/" element={<GameGrid games={games} />} />
        {games.map(game => (
          <Route key={game.route} path={`/${game.route}`} element={React.createElement(gameComponents[game.route])} />
        ))}
      </Routes>
    </React.Suspense>
  </Router>
);

export default App;
