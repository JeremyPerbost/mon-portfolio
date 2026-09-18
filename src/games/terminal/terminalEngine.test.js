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
  game.player.x = 630;
  game.player.y = 336;
  updateTerminalGame(game, 0.2, { x: 1, y: 0, shoot: true });

  expect(game.player.x).toBeGreaterThan(640);
  expect(game.player.facing).toBe("right");
  expect(game.bullets.some((bullet) => bullet.owner === "player") || game.score === 100).toBe(true);
});
