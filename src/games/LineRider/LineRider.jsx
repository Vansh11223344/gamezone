import React, { useRef, useState, useEffect } from "react";
import "./LineRider.css";

const WIDTH = 800, HEIGHT = 480;
const GRAVITY = 0.47, SLED_RADIUS = 16;
const TERRAIN_TYPES = {
  normal: { friction: 0.992, color: "#0655e6", shadow: "#9bcbfc40" },
  ice: { friction: 0.998, color: "#4ecdc4", shadow: "#a0e4e440" },
  sticky: { friction: 0.95, color: "#8b4513", shadow: "#d2b48c40" }
};

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function lerp(A, B, t) {
  return { x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t };
}
function segmentIntersect(A, B, C, D) {
  const det = (B.x - A.x) * (D.y - C.y) - (B.y - A.y) * (D.x - C.x);
  if (det === 0) return null;
  const t = ((C.x - A.x) * (D.y - C.y) - (C.y - A.y) * (D.x - C.x)) / det;
  const u = ((C.x - A.x) * (B.y - A.y) - (C.y - A.y) * (B.x - A.x)) / det;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return {
    x: A.x + t * (B.x - A.x),
    y: A.y + t * (B.y - A.y)
  };
}

function bezierPoint(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
  };
}

const SLED_START = { x: 48, y: 72, vx: 0, vy: 0, theta: 0, riding: false, crashed: false, animFrame: 0 };

export default function LineRider() {
  const canvasRef = useRef();
  const [lines, setLines] = useState([]); // Array of { type, points: [pt1, pt2] or [p0, p1, p2, p3] }
  const [drawing, setDrawing] = useState(null); // { type, x0, y0, x1, y1 } or { type, points: [p0, p1, p2, p3] }
  const [mode, setMode] = useState("draw"); // "draw", "erase", "curve"
  const [terrainType, setTerrainType] = useState("normal"); // "normal", "ice", "sticky"
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sled, setSled] = useState({ ...SLED_START });
  const [score, setScore] = useState(0);
  const [goal, setGoal] = useState(null); // { x, y }
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const animation = useRef();
  const [particles, setParticles] = useState([]); // Snow particles
  const [crashShake, setCrashShake] = useState(0);

  // Handle line drawing
  function handlePointerDown(e) {
    if (isPlaying || isPaused) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left - pan.x) / zoom;
    const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top - pan.y) / zoom;
    if (mode === "draw") {
      setDrawing({ type: "line", terrain: terrainType, x0: x, y0: y, x1: x, y1: y });
    } else if (mode === "curve") {
      setDrawing({ type: "curve", terrain: terrainType, points: [{ x, y }, { x, y }, { x, y }, { x, y }], activePoint: 0 });
    } else if (mode === "erase") {
      let erased = lines.slice();
      for (let i = 0; i < erased.length; i++) {
        if (erased[i].type === "line") {
          const [A, B] = erased[i].points;
          const t = ((x - A.x) * (B.x - A.x) + (y - A.y) * (B.y - A.y)) / (distance(A, B) ** 2);
          const pt = lerp(A, B, Math.max(0, Math.min(1, t)));
          if (distance(pt, { x, y }) < 15 / zoom) {
            erased.splice(i, 1);
            setLines(erased);
            break;
          }
        } else if (erased[i].type === "curve") {
          const [p0, p1, p2, p3] = erased[i].points;
          for (let t = 0; t <= 1; t += 0.01) {
            const pt = bezierPoint(t, p0, p1, p2, p3);
            if (distance(pt, { x, y }) < 15 / zoom) {
              erased.splice(i, 1);
              setLines(erased);
              return;
            }
          }
        }
      }
    }
  }

  function handlePointerMove(e) {
    if (!drawing || isPlaying || isPaused) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left - pan.x) / zoom;
    const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top - pan.y) / zoom;
    if (mode === "draw") {
      setDrawing(d => ({ ...d, x1: x, y1: y }));
    } else if (mode === "curve") {
      setDrawing(d => ({
        ...d,
        points: d.points.map((p, i) => (i === d.activePoint ? { x, y } : p)),
        activePoint: (d.activePoint + 1) % 4
      }));
    }
  }

  function handlePointerUp(e) {
    if (!drawing || isPlaying || isPaused) return;
    if (mode === "draw" && distance({ x: drawing.x0, y: drawing.y0 }, { x: drawing.x1, y: drawing.y1 }) > 5) {
      setLines(ls => [...ls, { type: "line", terrain: drawing.terrain, points: [{ x: drawing.x0, y: drawing.y0 }, { x: drawing.x1, y: drawing.y1 }] }]);
      if (!goal) setGoal({ x: drawing.x1, y: drawing.y1 });
    } else if (mode === "curve") {
      setLines(ls => [...ls, { type: "curve", terrain: drawing.terrain, points: drawing.points }]);
      if (!goal) setGoal({ x: drawing.points[3].x, y: drawing.points[3].y });
    }
    setDrawing(null);
  }

  function handleWheel(e) {
    e.preventDefault();
    const newZoom = Math.max(0.5, Math.min(2, zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    setZoom(newZoom);
  }

  function handlePanStart(e) {
    if (e.shiftKey || e.button === 1) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDrawing({ type: "pan", x0: e.clientX - rect.left, y0: e.clientY - rect.top });
    }
  }

  function handlePanMove(e) {
    if (drawing && drawing.type === "pan") {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setPan({ x: pan.x + (x - drawing.x0), y: pan.y + (y - drawing.y0) });
      setDrawing(d => ({ ...d, x0: x, y0: y }));
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "d") setMode("draw");
      else if (e.key === "e") setMode("erase");
      else if (e.key === "c") setMode("curve");
      else if (e.key === "p") {
        if (!isPlaying) {
          setSled({ ...SLED_START });
          setIsPlaying(true);
        } else {
          setIsPaused(p => !p);
        }
      } else if (e.key === "r") {
        setLines([]);
        setSled({ ...SLED_START });
        setIsPlaying(false);
        setIsPaused(false);
        setGoal(null);
        setScore(0);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  // Physics and rendering
  useEffect(() => {
    cancelAnimationFrame(animation.current);
    if (!isPlaying || isPaused) return;

    let sled = { ...SLED_START, riding: true, crashed: false, animFrame: 0 };
    let distanceTraveled = 0;
    function loop(t) {
      if (!sled.riding || sled.crashed) {
        setIsPlaying(false);
        setCrashShake(10);
        setTimeout(() => setCrashShake(0), 500);
        return;
      }

      // Physics
      sled.vy += GRAVITY;
      const speed = Math.hypot(sled.vx, sled.vy);
      const airResistance = 0.001 * speed * speed;
      sled.vx -= airResistance * Math.cos(sled.theta);
      sled.vy -= airResistance * Math.sin(sled.theta);
      let next = { x: sled.x + sled.vx, y: sled.y + sled.vy };
      let collided = false;
      let hitTheta = 0;
      let terrainFriction = TERRAIN_TYPES.normal.friction;

      // Check collisions
      for (const line of lines) {
        let inter = null;
        if (line.type === "line") {
          const [A, B] = line.points;
          inter = segmentIntersect({ x: sled.x, y: sled.y }, next, A, B);
          if (inter) {
            next = { x: inter.x, y: inter.y };
            hitTheta = Math.atan2(B.y - A.y, B.x - A.x);
            terrainFriction = TERRAIN_TYPES[line.terrain].friction;
          }
        } else if (line.type === "curve") {
          const [p0, p1, p2, p3] = line.points;
          for (let t = 0; t <= 1; t += 0.01) {
            const pt = bezierPoint(t, p0, p1, p2, p3);
            const nextT = Math.min(1, t + 0.01);
            const nextPt = bezierPoint(nextT, p0, p1, p2, p3);
            inter = segmentIntersect({ x: sled.x, y: sled.y }, next, pt, nextPt);
            if (inter) {
              next = { x: inter.x, y: inter.y };
              const tangent = bezierPoint(t + 0.001, p0, p1, p2, p3);
              hitTheta = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x);
              terrainFriction = TERRAIN_TYPES[line.terrain].friction;
              break;
            }
          }
        }
        if (inter) {
          const v = Math.hypot(sled.vx, sled.vy) * 0.95;
          sled.vx = v * Math.cos(hitTheta + 0.055);
          sled.vy = v * Math.sin(hitTheta + 0.055);
          sled.x = next.x + 2 * Math.cos(hitTheta);
          sled.y = next.y + 2 * Math.sin(hitTheta);
          collided = true;
          sled.theta = hitTheta;
          terrainFriction = TERRAIN_TYPES[line.terrain].friction;
          break;
        }
      }

      // Apply terrain friction
      if (collided) {
        sled.vx *= terrainFriction;
        sled.vy *= terrainFriction;
      }

      if (!collided) {
        sled.x = next.x;
        sled.y = next.y;
      }

      // Update score
      distanceTraveled += Math.hypot(sled.vx, sled.vy);
      setScore(Math.floor(distanceTraveled / 10));

      // Check goal
      if (goal && distance({ x: sled.x, y: sled.y }, goal) < 20) {
        setScore(s => s + 1000); // Bonus for reaching goal
        sled.crashed = true;
      }

      // Crash conditions
      if (
        sled.x < -100 || sled.y < -100 || sled.x > WIDTH + 100 || sled.y > HEIGHT + 100 ||
        (Math.abs(sled.vx) + Math.abs(sled.vy) < 0.23 && collided)
      ) {
        sled.crashed = true;
      }

      // Update sled animation
      sled.animFrame = (sled.animFrame + 0.1) % (2 * Math.PI);

      // Update snow particles
      setParticles(p => {
        const newParticles = p.filter(pt => pt.life > 0).map(pt => ({
          ...pt,
          x: pt.x + pt.vx,
          y: pt.y + pt.vy,
          life: pt.life - 0.02
        }));
        if (collided && Math.random() < 0.2) {
          newParticles.push({
            x: sled.x,
            y: sled.y + SLED_RADIUS,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1
          });
        }
        return newParticles;
      });

      setSled({ ...sled });
      if (!sled.crashed) animation.current = requestAnimationFrame(loop);
      else {
        setTimeout(() => setIsPlaying(false), 650);
        setCrashShake(10);
        setTimeout(() => setCrashShake(0), 500);
      }
    }
    animation.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animation.current);
  }, [isPlaying, isPaused, lines, goal]);

  // Render canvas
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Background
    ctx.fillStyle = "linear-gradient(to bottom, #87ceeb, #ffffff)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Apply zoom and pan
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Lines
    lines.forEach(line => {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = TERRAIN_TYPES[line.terrain].color;
      ctx.beginPath();
      if (line.type === "line") {
        const [A, B] = line.points;
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
      } else if (line.type === "curve") {
        const [p0, p1, p2, p3] = line.points;
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      }
      ctx.stroke();
      ctx.lineWidth = 5.5;
      ctx.strokeStyle = TERRAIN_TYPES[line.terrain].shadow;
      ctx.beginPath();
      if (line.type === "line") {
        const [A, B] = line.points;
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
      } else if (line.type === "curve") {
        const [p0, p1, p2, p3] = line.points;
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      }
      ctx.stroke();
      ctx.lineWidth = 2.5;
    });

    // Current drawing
    if (drawing && drawing.type === "line") {
      ctx.strokeStyle = "#f6c802";
      ctx.beginPath();
      ctx.moveTo(drawing.x0, drawing.y0);
      ctx.lineTo(drawing.x1, drawing.y1);
      ctx.stroke();
    } else if (drawing && drawing.type === "curve") {
      ctx.strokeStyle = "#f6c802";
      ctx.beginPath();
      ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
      ctx.bezierCurveTo(
        drawing.points[1].x, drawing.points[1].y,
        drawing.points[2].x, drawing.points[2].y,
        drawing.points[3].x, drawing.points[3].y
      );
      ctx.stroke();
      // Draw control points
      ctx.fillStyle = "#f6c802";
      drawing.points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 / zoom, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Snow particles
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 / zoom, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
      ctx.fill();
    });

    // Sled
    if (isPlaying || sled.riding) {
      ctx.save();
      ctx.translate(sled.x + (crashShake ? (Math.random() - 0.5) * crashShake : 0), sled.y + (crashShake ? (Math.random() - 0.5) * crashShake : 0));
      ctx.rotate(sled.theta);
      // Rider body
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 3.3 / zoom;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 18);
      ctx.stroke();
      // Arms (animated)
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.lineTo(8 * Math.sin(sled.animFrame), 12);
      ctx.moveTo(0, 6);
      ctx.lineTo(-8 * Math.sin(sled.animFrame), 12);
      ctx.stroke();
      // Sled
      ctx.strokeStyle = "#d75c1e";
      ctx.lineWidth = 5.2 / zoom;
      ctx.beginPath();
      ctx.moveTo(-12, 22);
      ctx.lineTo(12, 22);
      ctx.stroke();
      // Head
      ctx.beginPath();
      ctx.arc(0, 0, SLED_RADIUS / 2 / zoom, 0, 2 * Math.PI);
      ctx.fillStyle = sled.crashed ? "#faa" : "#fff";
      ctx.fill();
      ctx.restore();
    }

    // Goal flag
    ctx.font = `${25 / zoom}px serif`;
    ctx.globalAlpha = 0.77;
    ctx.fillStyle = "#12e653";
    ctx.fillText("START", 12, 32);
    if (goal) {
      ctx.fillStyle = "#ff4500";
      ctx.fillRect(goal.x - 5 / zoom, goal.y - 20 / zoom, 10 / zoom, 20 / zoom);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("GOAL", goal.x - 20 / zoom, goal.y - 25 / zoom);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }, [lines, drawing, isPlaying, sled, goal, particles, zoom, pan, crashShake]);

  function handleDownload() {
    const trackData = { lines, goal };
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "linerider.png";
    link.href = dataUrl;
    link.click();
    // Save track as JSON
    const jsonLink = document.createElement("a");
    jsonLink.download = "linerider-track.json";
    jsonLink.href = URL.createObjectURL(new Blob([JSON.stringify(trackData)], { type: "application/json" }));
    jsonLink.click();
  }

  const scale = Math.min(1, (window.innerWidth - 24) / WIDTH);

  return (
    <div className="linerider-container">
      <h2 className="linerider-title">LineRider: Snowy Slopes</h2>
      <div className="linerider-toolbar">
        <select
          value={terrainType}
          onChange={e => setTerrainType(e.target.value)}
          disabled={isPlaying}
          className="linerider-select"
        >
          <option value="normal">Normal</option>
          <option value="ice">Ice</option>
          <option value="sticky">Sticky</option>
        </select>
        <button
          className={`linerider-btn ${mode === "draw" ? "active" : ""}`}
          onClick={() => setMode("draw")}
          disabled={isPlaying}
        >
          ✏️ Draw
        </button>
        <button
          className={`linerider-btn ${mode === "curve" ? "active" : ""}`}
          onClick={() => setMode("curve")}
          disabled={isPlaying}
        >
          ➰ Curve
        </button>
        <button
          className={`linerider-btn ${mode === "erase" ? "active" : ""}`}
          onClick={() => setMode("erase")}
          disabled={isPlaying}
        >
          🧹 Erase
        </button>
        <button
          className="linerider-btn linerider-play"
          onClick={() => {
            if (!isPlaying) {
              setSled({ ...SLED_START });
              setIsPlaying(true);
              setIsPaused(false);
            } else {
              setIsPaused(p => !p);
            }
          }}
          disabled={lines.length === 0}
        >
          {isPlaying && !isPaused ? "⏸️ Pause" : "▶️ Play"}
        </button>
        <button
          className="linerider-btn"
          onClick={() => {
            setLines([]);
            setSled({ ...SLED_START });
            setIsPlaying(false);
            setIsPaused(false);
            setGoal(null);
            setScore(0);
          }}
        >
          🔄 Reset
        </button>
        <button className="linerider-btn" onClick={handleDownload} disabled={isPlaying}>
          ⬇️ Download
        </button>
      </div>
      <div className="linerider-stats">
        <span>Score: {score}</span>
        <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
      </div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{
          width: WIDTH * scale,
          height: HEIGHT * scale,
          touchAction: "none",
          transform: `translate(${crashShake ? (Math.random() - 0.5) * crashShake : 0}px, ${crashShake ? (Math.random() - 0.5) * crashShake : 0}px)`
        }}
        tabIndex={0}
        onMouseDown={e => { handlePointerDown(e); handlePanStart(e); }}
        onMouseMove={e => { handlePointerMove(e); handlePanMove(e); }}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onWheel={handleWheel}
      />
      <div className="linerider-footer">
        <span>Draw lines or curves, select terrain, then press Play (P). Use D/E/C to switch modes, R to reset. Shift+drag to pan, scroll to zoom.<br />
          <b>LineRider: Snowy Slopes</b></span>
      </div>
    </div>
  );
}