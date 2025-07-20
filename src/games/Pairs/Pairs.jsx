import React, { useState, useEffect } from "react";
import "./Pairs.css";

// Emoji or image pool for pairs
const PAIRS = ["🍎","🍋","🍇","🍒","🍉","🍑","🍓","🥝"];

function shuffle(arr) {
  let copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function initDeck() {
  const all = shuffle([...PAIRS, ...PAIRS]);
  return all.map((emoji, i) => ({
    emoji,
    index: i,
    matched: false,
    flipped: false
  }));
}

export default function Pairs() {
  const [deck, setDeck] = useState(initDeck());
  const [flipped, setFlipped] = useState([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [tries, setTries] = useState(0);
  const [win, setWin] = useState(false);

  useEffect(() => {
    if (matchedCount === PAIRS.length * 2) setWin(true);
  }, [matchedCount]);

  function restart() {
    setDeck(initDeck());
    setFlipped([]);
    setMatchedCount(0);
    setTries(0);
    setWin(false);
  }

  function onCardClick(idx) {
    if (win) return;
    const card = deck[idx];
    if (card.flipped || card.matched || flipped.length === 2) return;

    const newDeck = deck.map((c, i) =>
      i === idx ? { ...c, flipped: true } : c
    );
    const newFlipped = [...flipped, idx];

    setDeck(newDeck);
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setTries(tries + 1);
      const [fi, si] = newFlipped;
      if (deck[fi].emoji === deck[si].emoji) {
        // Match!
        setTimeout(() => {
          setDeck(d =>
            d.map((c, i) =>
              i === fi || i === si
                ? { ...c, matched: true }
                : c
            )
          );
          setMatchedCount(count => count + 2);
          setFlipped([]);
        }, 530);
      } else {
        // Not a match — flip back
        setTimeout(() => {
          setDeck(d =>
            d.map((c, i) =>
              i === fi || i === si
                ? { ...c, flipped: false }
                : c
            )
          );
          setFlipped([]);
        }, 890);
      }
    }
  }

  return (
    <div className="pairs-container">
      <div className="pairs-title">Pairs</div>
      <div className="pairs-topbar">
        <span>Turns: <strong>{tries}</strong></span>
        <button className="pairs-btn" onClick={restart}>Restart</button>
      </div>
      <div className="pairs-board"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        {deck.map((card, idx) =>
          <div
            className={
              "pairs-card" +
              (card.flipped || card.matched ? " flipped" : "") +
              (card.matched ? " matched" : "")
            }
            key={idx}
            onClick={() => onCardClick(idx)}
            tabIndex={card.matched ? -1 : 0}
            aria-label={card.flipped || card.matched ? card.emoji : "hidden"}
          >
            <div className="pairs-card-inner">
              <div className="pairs-card-front">{card.emoji}</div>
              <div className="pairs-card-back">?</div>
            </div>
          </div>
        )}
      </div>
      {win && (
        <div className="pairs-win">
          🎉 You matched all pairs in <b>{tries}</b> turns!<br />
          <button className="pairs-btn" onClick={restart}>Play Again</button>
        </div>
      )}
      <div className="pairs-footer">Classic Pairs | Classic style</div>
    </div>
  );
}
