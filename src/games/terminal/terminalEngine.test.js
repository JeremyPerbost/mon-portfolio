import { COLORS, createTerminalGame, updateTerminalGame } from "./terminalEngine";

test("crée un monde extensible avec la palette imposée", () => {
  const game = createTerminalGame();
  expect(game.zones.size).toBe(9);
  expect(game.player.lives).toBe(3);
  expect(COLORS).toEqual({ dark: "#222323", light: "#f0f6f0" });
  const formations = [...game.zones.values()].filter((zone) => zone.formation);
  expect(formations.length).toBeGreaterThan(0);
  expect(formations.every((zone) => zone.enemies.length >= 16 && zone.enemies.length <= 32)).toBe(true);
});

test("le tank peut tirer et traverser une ouverture entre deux zones", () => {
  const game = createTerminalGame();
  game.running = true;
  game.player.x = 950;
  game.player.y = 480;
  updateTerminalGame(game, 0.2, { x: 1, y: 0, shoot: false });
  updateTerminalGame(game, 0.01, { x: 0, y: 0, shoot: true });

  expect(game.player.x).toBeGreaterThan(960);
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
  game.zones.forEach((zone) => zone.enemies.forEach((enemy) => before.set(enemy.id, { x: enemy.x, y: enemy.y })));
  updateTerminalGame(game, 0.1, { x: 0, y: 0, shoot: false });

  let movingEnemies = 0;
  game.zones.forEach((zone) => zone.enemies.forEach((enemy) => {
    const start = before.get(enemy.id);
    if (!start) return;
    if (enemy.x !== start.x || enemy.y !== start.y) movingEnemies += 1;
    expect(enemy.x !== start.x && enemy.y !== start.y).toBe(false);
  }));
  expect(movingEnemies).toBeGreaterThan(0);
});

test("élimine un soldat lorsque le tank lui roule dessus", () => {
  const game = createTerminalGame();
  const enemy = game.zones.get("0,0").enemies.find((item) => item.alive);
  game.player.x = enemy.x;
  game.player.y = enemy.y;
  game.running = true;
  updateTerminalGame(game, 0.01, { x: 0, y: 0, shoot: false });

  expect(enemy.alive).toBe(false);
  expect(game.score).toBe(100);
});
