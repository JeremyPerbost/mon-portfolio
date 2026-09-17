export const TERMINAL_WIDTH = 960;
export const TERMINAL_HEIGHT = 540;
export const MAZE_SIZE = 61;
export const TIME_LIMIT = 120;

export const COLORS = { dark: "#222323", light: "#f0f6f0" };

const directions = [
  { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
];

function randomGenerator(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function createMaze(seed) {
  const random = randomGenerator(seed);
  const maze = Array.from({ length: MAZE_SIZE }, () => Array(MAZE_SIZE).fill(1));
  const stack = [{ x: 1, y: 1 }];
  maze[1][1] = 0;

  while (stack.length) {
    const current = stack[stack.length - 1];
    const next = shuffle(directions, random)
      .map(({ x, y }) => ({ x: current.x + x * 2, y: current.y + y * 2, wallX: current.x + x, wallY: current.y + y }))
      .find(({ x, y }) => x > 0 && y > 0 && x < MAZE_SIZE - 1 && y < MAZE_SIZE - 1 && maze[y][x] === 1);

    if (!next) {
      stack.pop();
      continue;
    }
    maze[next.wallY][next.wallX] = 0;
    maze[next.y][next.x] = 0;
    stack.push({ x: next.x, y: next.y });
  }
  return maze;
}

function findFarthestPoint(maze) {
  const queue = [{ x: 1, y: 1, distance: 0 }];
  const visited = new Set(["1,1"]);
  let farthest = queue[0];

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (current.distance > farthest.distance) farthest = current;
    directions.forEach(({ x, y }) => {
      const nextX = current.x + x;
      const nextY = current.y + y;
      const key = `${nextX},${nextY}`;
      if (maze[nextY]?.[nextX] === 0 && !visited.has(key)) {
        visited.add(key);
        queue.push({ x: nextX, y: nextY, distance: current.distance + 1 });
      }
    });
  }
  return { x: farthest.x, y: farthest.y };
}

export function createTerminalGame(seed = Date.now()) {
  const maze = createMaze(seed);
  return {
    maze,
    player: { x: 1, y: 1 },
    exit: findFarthestPoint(maze),
    remaining: TIME_LIMIT,
    moves: 0,
    running: false,
    won: false,
    timedOut: false,
    moveDelay: 0,
  };
}

export function updateTerminalGame(game, delta, direction) {
  if (!game.running) return;
  game.remaining = Math.max(0, game.remaining - delta);
  if (game.remaining === 0) {
    game.running = false;
    game.timedOut = true;
    return;
  }
  if (!direction) {
    game.moveDelay = 0;
    return;
  }
  game.moveDelay -= delta;
  if (game.moveDelay > 0) return;
  game.moveDelay = 0.065;

  const nextX = game.player.x + direction.x;
  const nextY = game.player.y + direction.y;
  if (game.maze[nextY]?.[nextX] !== 0) return;
  game.player = { x: nextX, y: nextY };
  game.moves += 1;
  if (nextX === game.exit.x && nextY === game.exit.y) {
    game.running = false;
    game.won = true;
  }
}

export function drawTerminalGame(ctx, game) {
  const { width, height } = ctx.canvas;
  const tile = 20;
  const columns = Math.ceil(width / tile) + 2;
  const rows = Math.ceil(height / tile) + 2;
  const cameraX = Math.max(0, Math.min(MAZE_SIZE - columns, game.player.x - Math.floor(columns / 2)));
  const cameraY = Math.max(0, Math.min(MAZE_SIZE - rows, game.player.y - Math.floor(rows / 2)));

  ctx.fillStyle = COLORS.dark;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = COLORS.light;
  for (let y = cameraY; y < Math.min(MAZE_SIZE, cameraY + rows); y += 1) {
    for (let x = cameraX; x < Math.min(MAZE_SIZE, cameraX + columns); x += 1) {
      if (game.maze[y][x] === 1) ctx.fillRect((x - cameraX) * tile, (y - cameraY) * tile, tile, tile);
    }
  }

  const exitX = (game.exit.x - cameraX) * tile;
  const exitY = (game.exit.y - cameraY) * tile;
  if (exitX >= 0 && exitY >= 0 && exitX < width && exitY < height) {
    ctx.fillRect(exitX + 2, exitY + 2, tile - 4, 3);
    ctx.fillRect(exitX + 2, exitY + tile - 5, tile - 4, 3);
    ctx.fillRect(exitX + 2, exitY + 2, 3, tile - 4);
    ctx.fillRect(exitX + tile - 5, exitY + 2, 3, tile - 4);
  }

  const playerX = (game.player.x - cameraX) * tile;
  const playerY = (game.player.y - cameraY) * tile;
  ctx.fillRect(playerX + 6, playerY + 6, 8, 8);

  if (!game.running) {
    ctx.fillStyle = COLORS.dark;
    ctx.fillRect(width / 2 - 230, height / 2 - 52, 460, 104);
    ctx.strokeStyle = COLORS.light;
    ctx.lineWidth = 2;
    ctx.strokeRect(width / 2 - 230, height / 2 - 52, 460, 104);
    ctx.fillStyle = COLORS.light;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 26px monospace";
    const title = game.won ? "SORTIE TROUVÉE" : game.timedOut ? "TEMPS ÉCOULÉ" : "TROUVEZ LA SORTIE";
    ctx.fillText(title, width / 2, height / 2 - 12);
    ctx.font = "14px monospace";
    ctx.fillText(game.won ? `${game.moves} déplacements` : "Le labyrinthe continue hors écran.", width / 2, height / 2 + 24);
    ctx.textAlign = "start";
  }
}
