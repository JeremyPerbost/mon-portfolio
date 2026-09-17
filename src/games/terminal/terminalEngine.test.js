import { COLORS, createTerminalGame, MAZE_SIZE, TIME_LIMIT, updateTerminalGame } from "./terminalEngine";

test("génère un grand labyrinthe avec une sortie accessible", () => {
  const game = createTerminalGame(42);
  const queue = [game.player];
  const visited = new Set([`${game.player.x},${game.player.y}`]);

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([x, y]) => {
      const next = { x: current.x + x, y: current.y + y };
      const key = `${next.x},${next.y}`;
      if (game.maze[next.y]?.[next.x] === 0 && !visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    });
  }

  expect(game.maze).toHaveLength(MAZE_SIZE);
  expect(visited.has(`${game.exit.x},${game.exit.y}`)).toBe(true);
  expect(game.exit).not.toEqual(game.player);
  expect(COLORS).toEqual({ dark: "#222323", light: "#f0f6f0" });
});

test("arrête la partie lorsque le temps est écoulé", () => {
  const game = createTerminalGame(7);
  game.running = true;
  updateTerminalGame(game, TIME_LIMIT, null);

  expect(game.running).toBe(false);
  expect(game.timedOut).toBe(true);
  expect(game.remaining).toBe(0);
});
