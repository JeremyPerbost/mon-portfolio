import { useEffect, useRef, useState } from "react";
import { createTerminalGame, drawTerminalGame, TERMINAL_HEIGHT, TERMINAL_WIDTH, TIME_LIMIT, updateTerminalGame } from "./terminalEngine";
import "./TerminalGame.css";

const keyDirections = {
  arrowup: { x: 0, y: -1 }, w: { x: 0, y: -1 }, z: { x: 0, y: -1 },
  arrowright: { x: 1, y: 0 }, d: { x: 1, y: 0 },
  arrowdown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
  arrowleft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, q: { x: -1, y: 0 },
};

function formatTime(seconds) {
  const value = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export default function TerminalGame() {
  const canvasRef = useRef(null);
  const gameRef = useRef(createTerminalGame());
  const keysRef = useRef([]);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(TIME_LIMIT);
  const [moves, setMoves] = useState(0);

  const start = () => {
    const next = createTerminalGame();
    next.running = true;
    gameRef.current = next;
    keysRef.current = [];
    setRemaining(TIME_LIMIT);
    setMoves(0);
    setRunning(true);
    canvasRef.current?.focus();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let frame;
    let previous = performance.now();
    let shownSecond = TIME_LIMIT;
    let shownMoves = 0;

    const loop = (now) => {
      const delta = Math.min((now - previous) / 1000, 0.04);
      previous = now;
      const game = gameRef.current;
      const activeKey = keysRef.current[keysRef.current.length - 1];
      updateTerminalGame(game, delta, keyDirections[activeKey] || null);
      drawTerminalGame(ctx, game);
      const second = Math.ceil(game.remaining);
      if (second !== shownSecond) { shownSecond = second; setRemaining(second); }
      if (game.moves !== shownMoves) { shownMoves = game.moves; setMoves(game.moves); }
      if (!game.running && (game.won || game.timedOut)) setRunning(false);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const setKey = (key, pressed) => {
    const normalized = key.toLowerCase();
    if (!keyDirections[normalized]) return;
    if (pressed && !keysRef.current.includes(normalized)) keysRef.current.push(normalized);
    if (!pressed) keysRef.current = keysRef.current.filter((item) => item !== normalized);
  };

  const handleKey = (event, pressed) => {
    const key = event.key.toLowerCase();
    if (keyDirections[key] || key === " " || key === "enter") event.preventDefault();
    setKey(key, pressed);
    if (pressed && (key === " " || key === "enter") && !gameRef.current.running) start();
  };

  const finished = gameRef.current.won || gameRef.current.timedOut;
  return (
    <div className="terminal-game">
      <div className="terminal-game__bar"><span>TERMINAL</span><span>TEMPS {formatTime(remaining)}</span><span>PAS {moves}</span></div>
      <div className="terminal-game__screen">
        <canvas
          ref={canvasRef}
          width={TERMINAL_WIDTH}
          height={TERMINAL_HEIGHT}
          tabIndex={0}
          aria-label="Labyrinthe Terminal. Déplacez le pixel avec les flèches ou les touches ZQSD pour trouver la sortie avant la fin du temps."
          onKeyDown={(event) => handleKey(event, true)}
          onKeyUp={(event) => handleKey(event, false)}
          onBlur={() => { keysRef.current = []; }}
        />
        {!running && <button type="button" className="terminal-game__start" onClick={start}>{finished ? "RECOMMENCER" : "COMMENCER"}</button>}
      </div>
      <div className="terminal-game__footer">
        <span>FLÈCHES / ZQSD</span>
        <div className="terminal-game__pad" aria-label="Contrôles tactiles">
          {[["↑", "arrowup"], ["←", "arrowleft"], ["↓", "arrowdown"], ["→", "arrowright"]].map(([label, key]) => (
            <button
              type="button"
              key={key}
              aria-label={key}
              onPointerDown={(event) => { event.preventDefault(); setKey(key, true); }}
              onPointerUp={() => setKey(key, false)}
              onPointerCancel={() => setKey(key, false)}
              onPointerLeave={() => setKey(key, false)}
            >{label}</button>
          ))}
        </div>
        <span>TROUVEZ LA SORTIE</span>
      </div>
    </div>
  );
}
