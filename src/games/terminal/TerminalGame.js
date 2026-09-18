import { useEffect, useRef, useState } from "react";
import { createTerminalGame, drawTerminalGame, TERMINAL_HEIGHT, TERMINAL_WIDTH, updateTerminalGame } from "./terminalEngine";
import { loadTerminalAssets } from "./terminalAssets";
import "./TerminalGame.css";

const movementKeys = {
  arrowup: "up", w: "up", z: "up",
  arrowright: "right", d: "right",
  arrowdown: "down", s: "down",
  arrowleft: "left", a: "left", q: "left",
};

export default function TerminalGame() {
  const canvasRef = useRef(null);
  const screenRef = useRef(null);
  const gameRef = useRef(createTerminalGame());
  const assetsRef = useRef(null);
  const keysRef = useRef([]);
  const shootRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [hud, setHud] = useState({ score: 0, lives: 3, distance: 0 });

  const start = () => {
    if (!assetsRef.current) return;
    const next = createTerminalGame();
    next.running = true;
    gameRef.current = next;
    keysRef.current = [];
    shootRef.current = false;
    setHud({ score: 0, lives: 3, distance: 0 });
    setRunning(true);
    canvasRef.current?.focus();
  };

  useEffect(() => {
    const screen = screenRef.current;
    const canvas = canvasRef.current;
    const fitCanvas = () => {
      const width = screen.clientWidth;
      const height = screen.clientHeight;
      const ratio = TERMINAL_WIDTH / TERMINAL_HEIGHT;
      if (width / height > ratio) {
        canvas.style.width = `${height * ratio}px`;
        canvas.style.height = `${height}px`;
      } else {
        canvas.style.width = `${width}px`;
        canvas.style.height = `${width / ratio}px`;
      }
    };
    const observer = new ResizeObserver(fitCanvas);
    observer.observe(screen);
    fitCanvas();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    loadTerminalAssets().then((assets) => {
      if (!active) return;
      assetsRef.current = assets;
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let frame;
    let previous = performance.now();
    let previousHud = "0,3,0";

    const loop = (now) => {
      const delta = Math.min((now - previous) / 1000, 0.035);
      previous = now;
      const keys = keysRef.current;
      const activeDirection = keys[keys.length - 1];
      const game = gameRef.current;
      updateTerminalGame(game, delta, {
        x: activeDirection === "right" ? 1 : activeDirection === "left" ? -1 : 0,
        y: activeDirection === "down" ? 1 : activeDirection === "up" ? -1 : 0,
        shoot: shootRef.current,
      });
      drawTerminalGame(ctx, game, assetsRef.current);

      const distance = Math.floor(game.distance / 32);
      const hudKey = `${game.score},${game.player.lives},${distance}`;
      if (hudKey !== previousHud) {
        previousHud = hudKey;
        setHud({ score: game.score, lives: game.player.lives, distance });
      }
      if (game.gameOver) setRunning(false);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const setDirection = (direction, pressed) => {
    keysRef.current = keysRef.current.filter((item) => item !== direction);
    if (pressed) keysRef.current.push(direction);
  };

  const handleKey = (event, pressed) => {
    const key = event.key.toLowerCase();
    const direction = movementKeys[key];
    if (direction || key === " " || key === "enter") event.preventDefault();
    if (direction) setDirection(direction, pressed);
    if (key === " " || key === "enter") shootRef.current = pressed;
    if (pressed && key === "enter" && !gameRef.current.running) start();
  };

  const aimAndShoot = (event) => {
    if (!gameRef.current.running) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * TERMINAL_WIDTH - TERMINAL_WIDTH / 2;
    const y = ((event.clientY - bounds.top) / bounds.height) * TERMINAL_HEIGHT - TERMINAL_HEIGHT / 2;
    gameRef.current.player.facing = Math.abs(x) > Math.abs(y) ? (x > 0 ? "right" : "left") : (y > 0 ? "down" : "up");
    shootRef.current = true;
  };

  const stopInputs = () => {
    keysRef.current = [];
    shootRef.current = false;
  };

  return (
    <div className="terminal-game">
      <div className="terminal-game__bar">
        <span>TERMINAL</span><span>SCORE {hud.score}</span><span>VIES {"■".repeat(hud.lives)}</span><span>DISTANCE {hud.distance}</span>
      </div>
      <div className="terminal-game__screen" ref={screenRef}>
        <canvas
          ref={canvasRef}
          width={TERMINAL_WIDTH}
          height={TERMINAL_HEIGHT}
          tabIndex={0}
          aria-label="Jeu Terminal. Déplacez le tank dans le labyrinthe infini et tirez sur les soldats ennemis."
          onKeyDown={(event) => handleKey(event, true)}
          onKeyUp={(event) => handleKey(event, false)}
          onBlur={stopInputs}
          onPointerDown={aimAndShoot}
          onPointerUp={() => { shootRef.current = false; }}
          onPointerCancel={() => { shootRef.current = false; }}
          onContextMenu={(event) => event.preventDefault()}
        />
        {!running && (
          <button type="button" className="terminal-game__start" onClick={start} disabled={!ready}>
            {ready ? (gameRef.current.gameOver ? "RECOMMENCER" : "COMMENCER") : "CHARGEMENT"}
          </button>
        )}
      </div>
      <div className="terminal-game__footer">
        <span>FLÈCHES / ZQSD</span>
        <div className="terminal-game__pad" aria-label="Contrôles tactiles">
          {[["↑", "up"], ["←", "left"], ["↓", "down"], ["→", "right"]].map(([label, direction]) => (
            <button
              type="button"
              key={direction}
              aria-label={direction}
              onPointerDown={(event) => { event.preventDefault(); setDirection(direction, true); }}
              onPointerUp={() => setDirection(direction, false)}
              onPointerCancel={() => setDirection(direction, false)}
              onPointerLeave={() => setDirection(direction, false)}
            >{label}</button>
          ))}
          <button
            type="button"
            className="terminal-game__fire"
            onPointerDown={(event) => { event.preventDefault(); shootRef.current = true; }}
            onPointerUp={() => { shootRef.current = false; }}
            onPointerCancel={() => { shootRef.current = false; }}
            onPointerLeave={() => { shootRef.current = false; }}
          >TIR</button>
        </div>
        <span>ESPACE / CLIC POUR TIRER</span>
      </div>
    </div>
  );
}
