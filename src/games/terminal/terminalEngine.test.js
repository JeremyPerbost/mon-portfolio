import { COLORS, createTerminalGame, updateTerminalGame } from "./terminalEngine";

test("crée un monde extensible avec la palette imposée", () => {
  const game = createTerminalGame();
  expect(game.chunks.size).toBe(25);
  expect(game.player.lives).toBe(3);
  expect(COLORS).toEqual({ dark: "#222323", light: "#f0f6f0" });
});

test("le tank peut tirer et traverser une ouverture entre deux zones", () => {
  const game = createTerminalGame();
  game.running = true;
  game.player.x = 694;
  game.player.y = 352;
  updateTerminalGame(game, 0.2, { x: 1, y: 0, shoot: false });
  updateTerminalGame(game, 0.01, { x: 0, y: 0, shoot: true });

  expect(game.player.x).toBeGreaterThan(704);
  expect(game.player.facing).toBe("right");
  expect(game.bullets.some((bullet) => bullet.owner === "player") || game.score === 100).toBe(true);
});

test("refuse les déplacements diagonaux", () => {
  const game = createTerminalGame();
  game.running = true;
  const start = { ...game.player };
  updateTerminalGame(game, 0.1, { x: 1, y: -1, shoot: false });

  expect(game.player.x).toBe(start.x);
  expect(game.player.y).toBeLessThan(start.y);
});

test("les soldats changent de position sur un seul axe", () => {
  const game = createTerminalGame();
  game.running = true;
  const before = new Map();
  game.chunks.forEach((chunk) => chunk.enemies.forEach((enemy) => before.set(enemy.id, { x: enemy.x, y: enemy.y })));
  updateTerminalGame(game, 0.1, { x: 0, y: 0, shoot: false });

  game.chunks.forEach((chunk) => chunk.enemies.forEach((enemy) => {
    const start = before.get(enemy.id);
    if (!start) return;
    expect(enemy.x !== start.x && enemy.y !== start.y).toBe(false);
  }));
});
