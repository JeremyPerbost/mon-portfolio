export const TERMINAL_WIDTH = 960;
export const TERMINAL_HEIGHT = 540;
export const WORLD_ZONE_SIZE = 960;
export const COLORS = { dark: "#222323", light: "#f0f6f0" };

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

function zoneKey(x, y) { return `${x},${y}`; }
function worldZone(value) { return Math.floor(value / WORLD_ZONE_SIZE); }

function createEnemy(zoneX, zoneY, index, localX, localY, formation = false) {
  const seed = hashCoordinates(zoneX, zoneY, index + 90);
  return {
    id: `${zoneKey(zoneX, zoneY)}-${index}`,
    x: zoneX * WORLD_ZONE_SIZE + localX,
    y: zoneY * WORLD_ZONE_SIZE + localY,
    facing: "down",
    cooldown: 0.8 + (hashCoordinates(zoneX, zoneY, index + 40) % 120) / 100,
    alive: true,
    formation,
    patrolAxis: seed & 1 ? "x" : "y",
    patrolDirection: seed & 2 ? 1 : -1,
    strafeDirection: seed & 4 ? 1 : -1,
    decisionTimer: 0.8 + (seed % 140) / 100,
  };
}

function createZone(zoneX, zoneY) {
  const seed = hashCoordinates(zoneX, zoneY, 17);
  const hasFormation = !(zoneX === 0 && zoneY === 0) && seed % 3 === 0;
  let enemies;
  let formation = null;

  if (hasFormation) {
    const formationSizes = [{ columns: 8, rows: 2 }, { columns: 8, rows: 3 }, { columns: 8, rows: 4 }];
    const size = formationSizes[(seed >>> 2) % formationSizes.length];
    const spacing = 48;
    const centerX = 480 + ((seed >>> 5) % 181) - 90;
    const centerY = 480 + ((seed >>> 9) % 181) - 90;
    enemies = Array.from({ length: size.columns * size.rows }, (_, index) => {
      const column = index % size.columns;
      const row = Math.floor(index / size.columns);
      const enemy = createEnemy(
        zoneX,
        zoneY,
        index,
        centerX + (column - (size.columns - 1) / 2) * spacing,
        centerY + (row - (size.rows - 1) / 2) * spacing,
        true,
      );
      enemy.formationColumn = column;
      enemy.formationRow = row;
      return enemy;
    });
    formation = {
      axis: seed % 2 === 0 ? "y" : "x",
      direction: seed & 1 ? 1 : -1,
      travelled: 0,
      range: 190 + (seed % 100),
      columns: size.columns,
      rows: size.rows,
    };
  } else {
    const positions = [
      { x: 230 + (seed % 90), y: 235 + ((seed >>> 3) % 110) },
      { x: 690 - ((seed >>> 6) % 90), y: 300 + ((seed >>> 9) % 160) },
      { x: 360 + ((seed >>> 12) % 220), y: 720 - ((seed >>> 15) % 100) },
    ];
    enemies = positions.map((position, index) => createEnemy(zoneX, zoneY, index, position.x, position.y));
    if (zoneX === 0 && zoneY === 0) enemies[0].alive = false;
  }

  return { x: zoneX, y: zoneY, enemies, formation };
}

function getZone(game, zoneX, zoneY) {
  const key = zoneKey(zoneX, zoneY);
  if (!game.zones.has(key)) game.zones.set(key, createZone(zoneX, zoneY));
  return game.zones.get(key);
}

function getNearbyZones(game, x, y, radius = 1) {
  const centerX = worldZone(x);
  const centerY = worldZone(y);
  const zones = [];
  for (let zy = centerY - radius; zy <= centerY + radius; zy += 1) {
    for (let zx = centerX - radius; zx <= centerX + radius; zx += 1) zones.push(getZone(game, zx, zy));
  }
  return zones;
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
    player: { x: WORLD_ZONE_SIZE / 2, y: WORLD_ZONE_SIZE / 2, facing: "up", lives: 3, cooldown: 0, shotAnimation: 0, animation: 0, invulnerable: 0 },
    zones: new Map(),
    bullets: [],
    score: 0,
    distance: 0,
    running: false,
    gameOver: false,
  };
  getNearbyZones(game, game.player.x, game.player.y);
  return game;
}

function moveFormation(zone, delta) {
  if (!zone.formation) return;
  const formation = zone.formation;
  const speed = 48;
  const movement = speed * delta * formation.direction;
  zone.enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    if (formation.axis === "x") enemy.x += movement;
    else enemy.y += movement;
    enemy.facing = formation.axis === "x"
      ? (formation.direction > 0 ? "right" : "left")
      : (formation.direction > 0 ? "down" : "up");
  });
  formation.travelled += Math.abs(movement);
  if (formation.travelled >= formation.range) {
    formation.travelled = 0;
    formation.direction *= -1;
  }
}

function moveSoloEnemy(enemy, player, delta) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const distance = Math.hypot(dx, dy);
  enemy.decisionTimer -= delta;
  if (enemy.decisionTimer <= 0) {
    enemy.decisionTimer = 1.1 + (hashCoordinates(Math.round(enemy.x), Math.round(enemy.y), Math.round(distance)) % 120) / 100;
    enemy.strafeDirection *= -1;
    if (distance > 760) enemy.patrolDirection *= -1;
  }

  let direction;
  let speed = 56;
  if (distance > 760) {
    direction = enemy.patrolAxis === "x" ? { x: enemy.patrolDirection, y: 0 } : { x: 0, y: enemy.patrolDirection };
    speed = 38;
  } else if (distance > 310) {
    direction = Math.abs(dx) >= Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
  } else if (distance < 145) {
    direction = Math.abs(dx) >= Math.abs(dy) ? { x: -Math.sign(dx), y: 0 } : { x: 0, y: -Math.sign(dy) };
    speed = 66;
  } else if (Math.min(Math.abs(dx), Math.abs(dy)) > 52) {
    direction = Math.abs(dx) < Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
    speed = 48;
  } else {
    direction = Math.abs(dx) >= Math.abs(dy)
      ? { x: 0, y: enemy.strafeDirection }
      : { x: enemy.strafeDirection, y: 0 };
    speed = 44;
  }

  enemy.x += direction.x * speed * delta;
  enemy.y += direction.y * speed * delta;
  enemy.facing = facingFromVector(direction.x, direction.y, enemy.facing);
}

function updateEnemies(game, delta) {
  const player = game.player;
  const zones = getNearbyZones(game, player.x, player.y);
  zones.forEach((zone) => {
    moveFormation(zone, delta);
    zone.enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      enemy.cooldown = Math.max(0, enemy.cooldown - delta);
      if (!enemy.formation) moveSoloEnemy(enemy, player, delta);
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 470 && Math.min(Math.abs(dx), Math.abs(dy)) < 58 && enemy.cooldown === 0) {
        enemy.facing = facingFromVector(dx, dy, enemy.facing);
        createBullet(game, "enemy", enemy.x, enemy.y, enemy.facing);
        enemy.cooldown = 1.25 + (hashCoordinates(Math.round(enemy.x), Math.round(enemy.y), game.score) % 80) / 100;
      }
    });
  });
}

function updateBullets(game, delta) {
  const player = game.player;
  game.bullets = game.bullets.filter((bullet) => {
    bullet.x += bullet.vx * delta;
    bullet.y += bullet.vy * delta;
    bullet.life -= delta;
    if (bullet.life <= 0) return false;

    if (bullet.owner === "player") {
      const zones = getNearbyZones(game, bullet.x, bullet.y);
      for (const zone of zones) {
        const enemy = zone.enemies.find((item) => item.alive && Math.hypot(item.x - bullet.x, item.y - bullet.y) < 18);
        if (enemy) { enemy.alive = false; game.score += 100; return false; }
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

function eliminateRunOverEnemies(game) {
  getNearbyZones(game, game.player.x, game.player.y).forEach((zone) => zone.enemies.forEach((enemy) => {
    if (!enemy.alive || Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y) >= 28) return;
    enemy.alive = false;
    game.score += 100;
  }));
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
  player.x += moveX * PLAYER_SPEED * delta;
  player.y += moveY * PLAYER_SPEED * delta;
  if (moveX || moveY) { player.animation += delta; game.distance += PLAYER_SPEED * delta; }
  eliminateRunOverEnemies(game);

  if (input.shoot && player.cooldown === 0) {
    createBullet(game, "player", player.x, player.y, player.facing);
    player.cooldown = 0.28;
    player.shotAnimation = 0.28;
  }
  updateEnemies(game, delta);
  updateBullets(game, delta);
}

function drawSheetFrame(ctx, image, frame, x, y, size = 44, columns = 2) {
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
  const zones = getNearbyZones(game, game.player.x, game.player.y);
  zones.forEach((zone) => zone.enemies.forEach((enemy) => {
    if (!enemy.alive || !isVisible(enemy.x, enemy.y, cameraX, cameraY)) return;
    const image = assets[`enemy${enemy.facing[0].toUpperCase()}${enemy.facing.slice(1)}`];
    ctx.drawImage(image, Math.round(enemy.x - cameraX - 16), Math.round(enemy.y - cameraY - 16), 32, 32);
  }));

  game.bullets.forEach((bullet) => ctx.drawImage(assets.bullet, Math.round(bullet.x - cameraX - 7), Math.round(bullet.y - cameraY - 7), 14, 14));

  const player = game.player;
  if (player.invulnerable === 0 || Math.floor(player.invulnerable * 12) % 2 === 0) {
    const screenX = player.x - cameraX;
    const screenY = player.y - cameraY;
    if (player.shotAnimation > 0) {
      const frame = Math.min(6, Math.floor((0.28 - player.shotAnimation) / 0.04));
      const name = `playerShot${player.facing[0].toUpperCase()}${player.facing.slice(1)}`;
      drawSheetFrame(ctx, assets[name], frame, screenX, screenY, 44, 3);
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
    ctx.fillText(game.gameOver ? "MISSION TERMINÉE" : "SURVIE INFINIE", TERMINAL_WIDTH / 2, TERMINAL_HEIGHT / 2 - 14);
    ctx.font = "14px monospace";
    ctx.fillText(game.gameOver ? `Score : ${game.score}` : "Avancez. Survivez. Détruisez.", TERMINAL_WIDTH / 2, TERMINAL_HEIGHT / 2 + 24);
    ctx.textAlign = "start";
  }
}
