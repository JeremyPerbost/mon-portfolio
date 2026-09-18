export const TERMINAL_WIDTH = 960;
export const TERMINAL_HEIGHT = 540;
export const COLORS = { dark: "#222323", light: "#f0f6f0" };

const TILE = 32;
const CELL_COUNT = 7;
const CHUNK_TILES = CELL_COUNT * 3 + 1;
const CHUNK_SIZE = TILE * CHUNK_TILES;
const PLAYER_SPEED = 175;
const BULLET_SPEED = 430;
const directionVectors = {
  up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 },
};

function hashCoordinates(x, y, salt = 0) {
  let value = Math.imul(x ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(y ^ salt, 0xc2b2ae35);
  value ^= value >>> 16;
  return value >>> 0;
}

function chunkKey(x, y) { return `${x},${y}`; }
function worldChunk(value) { return Math.floor(value / CHUNK_SIZE); }

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function shuffledDirections(random) {
  const values = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
  for (let index = values.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [values[index], values[target]] = [values[target], values[index]];
  }
  return values;
}

function wallSprites(grid, x, y) {
  const left = Boolean(grid[y]?.[x - 1]);
  const right = Boolean(grid[y]?.[x + 1]);
  const up = Boolean(grid[y - 1]?.[x]);
  const down = Boolean(grid[y + 1]?.[x]);
  if (right && down && !left && !up) return ["wallTopLeft"];
  if (left && down && !right && !up) return ["wallTopRight"];
  if (right && up && !left && !down) return ["wallBottomLeft"];
  if (left && up && !right && !down) return ["wallBottomRight"];
  if ((left || right) && !(up || down)) return ["wallHorizontal"];
  if ((up || down) && !(left || right)) return ["wallVertical"];
  return ["wallHorizontal", "wallVertical"];
}

function createMazeGrid(chunkX, chunkY) {
  const grid = Array.from({ length: CHUNK_TILES }, () => Array(CHUNK_TILES).fill(1));
  const visited = Array.from({ length: CELL_COUNT }, () => Array(CELL_COUNT).fill(false));
  const random = seededRandom(hashCoordinates(chunkX, chunkY, 71));
  const stack = [{ x: Math.floor(CELL_COUNT / 2), y: Math.floor(CELL_COUNT / 2) }];

  const clearCell = (cellX, cellY) => {
    const startX = 1 + cellX * 3;
    const startY = 1 + cellY * 3;
    grid[startY][startX] = 0;
    grid[startY][startX + 1] = 0;
    grid[startY + 1][startX] = 0;
    grid[startY + 1][startX + 1] = 0;
  };

  visited[stack[0].y][stack[0].x] = true;
  clearCell(stack[0].x, stack[0].y);
  while (stack.length) {
    const current = stack[stack.length - 1];
    const nextDirection = shuffledDirections(random).find(({ x, y }) => {
      const nextX = current.x + x;
      const nextY = current.y + y;
      return nextX >= 0 && nextY >= 0 && nextX < CELL_COUNT && nextY < CELL_COUNT && !visited[nextY][nextX];
    });
    if (!nextDirection) { stack.pop(); continue; }

    const next = { x: current.x + nextDirection.x, y: current.y + nextDirection.y };
    visited[next.y][next.x] = true;
    clearCell(next.x, next.y);
    const currentStartX = 1 + current.x * 3;
    const currentStartY = 1 + current.y * 3;
    if (nextDirection.x === 1) { grid[currentStartY][currentStartX + 2] = 0; grid[currentStartY + 1][currentStartX + 2] = 0; }
    if (nextDirection.x === -1) { grid[currentStartY][currentStartX - 1] = 0; grid[currentStartY + 1][currentStartX - 1] = 0; }
    if (nextDirection.y === 1) { grid[currentStartY + 2][currentStartX] = 0; grid[currentStartY + 2][currentStartX + 1] = 0; }
    if (nextDirection.y === -1) { grid[currentStartY - 1][currentStartX] = 0; grid[currentStartY - 1][currentStartX + 1] = 0; }
    stack.push(next);
  }

  const openingStart = 1 + Math.floor(CELL_COUNT / 2) * 3;
  grid[0][openingStart] = 0; grid[0][openingStart + 1] = 0;
  grid[CHUNK_TILES - 1][openingStart] = 0; grid[CHUNK_TILES - 1][openingStart + 1] = 0;
  grid[openingStart][0] = 0; grid[openingStart + 1][0] = 0;
  grid[openingStart][CHUNK_TILES - 1] = 0; grid[openingStart + 1][CHUNK_TILES - 1] = 0;
  return grid;
}

function createChunk(chunkX, chunkY) {
  const grid = createMazeGrid(chunkX, chunkY);
  const walls = [];
  grid.forEach((row, tileY) => row.forEach((occupied, tileX) => {
    if (!occupied) return;
    walls.push({
      x: chunkX * CHUNK_SIZE + tileX * TILE,
      y: chunkY * CHUNK_SIZE + tileY * TILE,
      width: TILE,
      height: TILE,
      types: wallSprites(grid, tileX, tileY),
    });
  }));

  const variant = hashCoordinates(chunkX, chunkY, 17) % 4;
  const enemyPositions = variant % 2 === 0 ? [{ x: 1, y: 1 }, { x: 5, y: 5 }] : [{ x: 5, y: 1 }, { x: 1, y: 5 }];
  const enemies = enemyPositions.map((position, index) => ({
    id: `${chunkKey(chunkX, chunkY)}-${index}`,
    x: chunkX * CHUNK_SIZE + (2 + position.x * 3) * TILE,
    y: chunkY * CHUNK_SIZE + (2 + position.y * 3) * TILE,
    facing: "down",
    cooldown: 0.7 + (hashCoordinates(chunkX, chunkY, index + 40) % 120) / 100,
    alive: !(chunkX === 0 && chunkY === 0 && index === 0),
  }));

  return { x: chunkX, y: chunkY, walls, enemies };
}

function getChunk(game, chunkX, chunkY) {
  const key = chunkKey(chunkX, chunkY);
  if (!game.chunks.has(key)) game.chunks.set(key, createChunk(chunkX, chunkY));
  return game.chunks.get(key);
}

function getNearbyChunks(game, x, y, radius = 1) {
  const centerX = worldChunk(x);
  const centerY = worldChunk(y);
  const chunks = [];
  for (let cy = centerY - radius; cy <= centerY + radius; cy += 1) {
    for (let cx = centerX - radius; cx <= centerX + radius; cx += 1) chunks.push(getChunk(game, cx, cy));
  }
  return chunks;
}

function overlapsWall(game, x, y, halfSize) {
  return getNearbyChunks(game, x, y).some((chunk) => chunk.walls.some((wall) => (
    x + halfSize > wall.x && x - halfSize < wall.x + wall.width
    && y + halfSize > wall.y && y - halfSize < wall.y + wall.height
  )));
}

function moveEntity(game, entity, velocityX, velocityY, delta, halfSize) {
  let moved = false;
  const nextX = entity.x + velocityX * delta;
  if (!overlapsWall(game, nextX, entity.y, halfSize)) { entity.x = nextX; moved = moved || velocityX !== 0; }
  const nextY = entity.y + velocityY * delta;
  if (!overlapsWall(game, entity.x, nextY, halfSize)) { entity.y = nextY; moved = moved || velocityY !== 0; }
  return moved;
}

function facingFromVector(x, y, fallback = "down") {
  if (Math.abs(x) > Math.abs(y)) return x > 0 ? "right" : "left";
  if (Math.abs(y) > 0) return y > 0 ? "down" : "up";
  return fallback;
}

function createBullet(game, owner, x, y, facing) {
  const vector = directionVectors[facing];
  game.bullets.push({ owner, x: x + vector.x * 20, y: y + vector.y * 20, vx: vector.x * BULLET_SPEED, vy: vector.y * BULLET_SPEED, life: 2 });
}

export function createTerminalGame() {
  const game = {
    player: { x: CHUNK_SIZE / 2, y: CHUNK_SIZE / 2, facing: "up", lives: 3, cooldown: 0, shotAnimation: 0, animation: 0, invulnerable: 0 },
    chunks: new Map(),
    bullets: [],
    score: 0,
    distance: 0,
    running: false,
    gameOver: false,
  };
  getNearbyChunks(game, game.player.x, game.player.y, 2);
  return game;
}

function updateEnemies(game, delta) {
  const player = game.player;
  const chunks = getNearbyChunks(game, player.x, player.y, 2);
  chunks.forEach((chunk) => chunk.enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    enemy.cooldown = Math.max(0, enemy.cooldown - delta);
    if (distance > 760) return;

    if (distance > 175) {
      const speed = 56;
      const horizontal = { x: Math.sign(dx), y: 0 };
      const vertical = { x: 0, y: Math.sign(dy) };
      const primary = Math.abs(dx) >= Math.abs(dy) ? horizontal : vertical;
      const secondary = primary === horizontal ? vertical : horizontal;
      const choices = [primary, secondary, { x: -secondary.x, y: -secondary.y }, { x: -primary.x, y: -primary.y }];
      for (const choice of choices) {
        if ((!choice.x && !choice.y) || !moveEntity(game, enemy, choice.x * speed, choice.y * speed, delta, 10)) continue;
        enemy.facing = facingFromVector(choice.x, choice.y, enemy.facing);
        break;
      }
    }
    if (distance < 470 && Math.min(Math.abs(dx), Math.abs(dy)) < 58 && enemy.cooldown === 0) {
      enemy.facing = facingFromVector(dx, dy, enemy.facing);
      createBullet(game, "enemy", enemy.x, enemy.y, enemy.facing);
      enemy.cooldown = 1.25 + (hashCoordinates(Math.round(enemy.x), Math.round(enemy.y), game.score) % 80) / 100;
    }
  }));
}

function updateBullets(game, delta) {
  const player = game.player;
  game.bullets = game.bullets.filter((bullet) => {
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;
    bullet.life -= delta;
    if (bullet.life <= 0 || overlapsWall(game, bullet.x, bullet.y, 4)) return false;

    if (bullet.owner === "player") {
      const chunks = getNearbyChunks(game, bullet.x, bullet.y);
      for (const chunk of chunks) {
        const enemy = chunk.enemies.find((item) => item.alive && Math.hypot(item.x - bullet.x, item.y - bullet.y) < 18);
        if (enemy) {
          enemy.alive = false;
          game.score += 100;
          return false;
        }
      }
    } else if (player.invulnerable === 0 && Math.hypot(player.x - bullet.x, player.y - bullet.y) < 17) {
      player.lives -= 1;
      player.invulnerable = 1.2;
      if (player.lives <= 0) { game.running = false; game.gameOver = true; }
      return false;
    }
    return true;
  });
}

export function updateTerminalGame(game, delta, input = {}) {
  if (!game.running) return;
  const player = game.player;
  player.cooldown = Math.max(0, player.cooldown - delta);
  player.shotAnimation = Math.max(0, player.shotAnimation - delta);
  player.invulnerable = Math.max(0, player.invulnerable - delta);

  let moveX = input.x || 0;
  let moveY = input.y || 0;
  if (moveX && moveY) {
    if (player.facing === "left" || player.facing === "right") moveY = 0;
    else moveX = 0;
  }
  if (moveX || moveY) player.facing = facingFromVector(moveX, moveY, player.facing);
  const moved = moveEntity(game, player, moveX * PLAYER_SPEED, moveY * PLAYER_SPEED, delta, 12);
  if (moved) { player.animation += delta; game.distance += PLAYER_SPEED * delta; }

  if (input.shoot && player.cooldown === 0) {
    createBullet(game, "player", player.x, player.y, player.facing);
    player.cooldown = 0.28;
    player.shotAnimation = 0.28;
  }

  updateEnemies(game, delta);
  updateBullets(game, delta);
}

function drawSheetFrame(ctx, image, frame, x, y, size = 40, columns = 2) {
  const sourceX = (frame % columns) * 32;
  const sourceY = Math.floor(frame / columns) * 32;
  ctx.drawImage(image, sourceX, sourceY, 32, 32, Math.round(x - size / 2), Math.round(y - size / 2), size, size);
}

function isVisible(x, y, cameraX, cameraY, margin = 48) {
  return x > cameraX - margin && y > cameraY - margin && x < cameraX + TERMINAL_WIDTH + margin && y < cameraY + TERMINAL_HEIGHT + margin;
}

export function drawTerminalGame(ctx, game, assets) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = COLORS.dark;
  ctx.fillRect(0, 0, TERMINAL_WIDTH, TERMINAL_HEIGHT);
  if (!assets) return;

  const cameraX = game.player.x - TERMINAL_WIDTH / 2;
  const cameraY = game.player.y - TERMINAL_HEIGHT / 2;
  const chunks = getNearbyChunks(game, game.player.x, game.player.y, 2);

  chunks.forEach((chunk) => chunk.walls.forEach((wall) => {
    if (!isVisible(wall.x, wall.y, cameraX, cameraY)) return;
    wall.types.forEach((type) => ctx.drawImage(assets[type], Math.round(wall.x - cameraX), Math.round(wall.y - cameraY), TILE, TILE));
  }));

  chunks.forEach((chunk) => chunk.enemies.forEach((enemy) => {
    if (!enemy.alive || !isVisible(enemy.x, enemy.y, cameraX, cameraY)) return;
    const image = assets[`enemy${enemy.facing[0].toUpperCase()}${enemy.facing.slice(1)}`];
    ctx.drawImage(image, Math.round(enemy.x - cameraX - 16), Math.round(enemy.y - cameraY - 16), 32, 32);
  }));

  game.bullets.forEach((bullet) => {
    ctx.drawImage(assets.bullet, Math.round(bullet.x - cameraX - 7), Math.round(bullet.y - cameraY - 7), 14, 14);
  });

  const player = game.player;
  if (player.invulnerable === 0 || Math.floor(player.invulnerable * 12) % 2 === 0) {
    const screenX = player.x - cameraX;
    const screenY = player.y - cameraY;
    if (player.shotAnimation > 0) {
      const frame = Math.min(6, Math.floor((0.28 - player.shotAnimation) / 0.04));
      const name = `playerShot${player.facing[0].toUpperCase()}${player.facing.slice(1)}`;
      drawSheetFrame(ctx, assets[name], frame, screenX, screenY, 52, 3);
    } else {
      const frame = Math.floor(player.animation * 8) % 3;
      const name = `player${player.facing[0].toUpperCase()}${player.facing.slice(1)}`;
      drawSheetFrame(ctx, assets[name], frame, screenX, screenY, 44, 2);
    }
  }

  if (!game.running) {
    ctx.fillStyle = COLORS.dark;
    ctx.fillRect(TERMINAL_WIDTH / 2 - 235, TERMINAL_HEIGHT / 2 - 58, 470, 116);
    ctx.strokeStyle = COLORS.light;
    ctx.lineWidth = 2;
    ctx.strokeRect(TERMINAL_WIDTH / 2 - 235, TERMINAL_HEIGHT / 2 - 58, 470, 116);
    ctx.fillStyle = COLORS.light;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 25px monospace";
    ctx.fillText(game.gameOver ? "MISSION TERMINÉE" : "LABYRINTHE INFINI", TERMINAL_WIDTH / 2, TERMINAL_HEIGHT / 2 - 14);
    ctx.font = "14px monospace";
    ctx.fillText(game.gameOver ? `Score : ${game.score}` : "Avancez. Survivez. Détruisez.", TERMINAL_WIDTH / 2, TERMINAL_HEIGHT / 2 + 24);
    ctx.textAlign = "start";
  }
}
