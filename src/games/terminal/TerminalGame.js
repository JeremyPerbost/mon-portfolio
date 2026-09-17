import { useEffect, useRef, useState } from "react";
import { createTerminalGame, drawTerminalGame, TERMINAL_HEIGHT, TERMINAL_WIDTH, updateTerminalGame } from "./terminalEngine";
import "./TerminalGame.css";

export default function TerminalGame() {
  const canvasRef = useRef(null);
  const gameRef = useRef(createTerminalGame());
  const keysRef = useRef(new Set());
  const pointerRef = useRef(null);
  const runningRef = useRef(false);
  const scoreRef = useRef(0);
  const bestRef = useRef(Number(localStorage.getItem("terminal-best") || 0));
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(bestRef.current);

  const start = () => {
    const next = createTerminalGame();
    next.running = true;
    gameRef.current = next;
    pointerRef.current = null;
    runningRef.current = true;
    scoreRef.current = 0;
    setScore(0);
    setRunning(true);
    canvasRef.current?.focus();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let frame;
    let previous = performance.now();

    const loop = (now) => {
      const delta = Math.min((now - previous) / 1000, 0.04);
      previous = now;
      const keys = keysRef.current;
      const direction = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
      const game = gameRef.current;
      updateTerminalGame(game, delta, direction, pointerRef.current);
      drawTerminalGame(ctx, game);

      if (game.score !== scoreRef.current) {
        scoreRef.current = game.score;
        setScore(game.score);
        if (game.score > bestRef.current) {
          bestRef.current = game.score;
          setBest(game.score);
          localStorage.setItem("terminal-best", String(game.score));
        }
      }
      if (runningRef.current && game.gameOver) {
        runningRef.current = false;
        setRunning(false);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleKey = (event, pressed) => {
    const key = event.key.toLowerCase();
    if (["arrowleft", "arrowright", "a", "d", " ", "enter"].includes(key)) event.preventDefault();
    if (pressed) keysRef.current.add(key);
    else keysRef.current.delete(key);
    if (pressed && (event.key === " " || event.key === "Enter") && !running) start();
  };

  const handlePointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerRef.current = ((event.clientX - bounds.left) / bounds.width) * TERMINAL_WIDTH;
  };

  return (
    <div className="terminal-game">
      <div className="terminal-game__bar">
        <span><i /> terminal.exe</span>
        <span>Score {score} · Record {best}</span>
      </div>
      <div className="terminal-game__screen">
        <canvas
          ref={canvasRef}
          width={TERMINAL_WIDTH}
          height={TERMINAL_HEIGHT}
          tabIndex={0}
          aria-label="Jeu Terminal. Déplacez le curseur avec les flèches gauche et droite pour collecter le code vert et éviter les erreurs rouges."
          onKeyDown={(event) => handleKey(event, true)}
          onKeyUp={(event) => handleKey(event, false)}
          onPointerMove={handlePointer}
          onPointerLeave={() => { pointerRef.current = null; }}
        />
        {!running && <button type="button" onClick={start}>{gameRef.current.gameOver ? "Rejouer" : "Lancer le jeu"}<span aria-hidden="true">↗</span></button>}
      </div>
      <p className="terminal-game__help">← → / A D / souris <span>Collectez le vert · évitez le rouge</span></p>
    </div>
  );
}
