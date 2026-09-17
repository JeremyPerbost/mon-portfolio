export const TERMINAL_WIDTH = 960;
export const TERMINAL_HEIGHT = 540;

const goodTokens = ["git", "npm", "0101", "{ }", "sudo", "ping"];
const badTokens = ["ERR", "BUG", "404", "NULL"];

export function createTerminalGame() {
  return {
    playerX: TERMINAL_WIDTH / 2,
    objects: [],
    spawnIn: 0.35,
    score: 0,
    lives: 3,
    elapsed: 0,
    running: false,
    gameOver: false,
  };
}

function spawnObject(game) {
  const bad = Math.random() < Math.min(0.24 + game.score / 900, 0.48);
  const labels = bad ? badTokens : goodTokens;
  game.objects.push({
    x: 44 + Math.random() * (TERMINAL_WIDTH - 88),
    y: -30,
    speed: 125 + Math.random() * 75 + Math.min(game.score, 500) * 0.18,
    label: labels[Math.floor(Math.random() * labels.length)],
    bad,
  });
}

export function updateTerminalGame(game, delta, direction = 0, pointerX = null) {
  if (!game.running || game.gameOver) return;
  game.elapsed += delta;
  game.playerX = pointerX === null
    ? game.playerX + direction * 330 * delta
    : game.playerX + (pointerX - game.playerX) * Math.min(1, delta * 10);
  game.playerX = Math.max(42, Math.min(TERMINAL_WIDTH - 42, game.playerX));

  game.spawnIn -= delta;
  if (game.spawnIn <= 0) {
    spawnObject(game);
    game.spawnIn = Math.max(0.32, 0.72 - game.score / 1600);
  }

  for (const item of game.objects) item.y += item.speed * delta;
  const playerY = TERMINAL_HEIGHT - 62;
  game.objects = game.objects.filter((item) => {
    const collision = Math.abs(item.x - game.playerX) < 52 && Math.abs(item.y - playerY) < 35;
    if (collision) {
      if (item.bad) game.lives -= 1;
      else game.score += 10;
      if (game.lives <= 0) {
        game.lives = 0;
        game.running = false;
        game.gameOver = true;
      }
      return false;
    }
    return item.y < TERMINAL_HEIGHT + 40;
  });
}

export function drawTerminalGame(ctx, game) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#050814";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(76, 224, 167, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  ctx.font = "700 16px monospace";
  ctx.textBaseline = "middle";
  for (const item of game.objects) {
    ctx.fillStyle = item.bad ? "#ff5c70" : "#71f2b6";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 14;
    ctx.fillText(item.label, item.x - ctx.measureText(item.label).width / 2, item.y);
  }
  ctx.shadowBlur = 0;

  const playerY = height - 62;
  ctx.fillStyle = "rgba(113, 242, 182, 0.14)";
  ctx.fillRect(game.playerX - 38, playerY - 22, 76, 44);
  ctx.strokeStyle = "#71f2b6";
  ctx.strokeRect(game.playerX - 38, playerY - 22, 76, 44);
  ctx.fillStyle = "#eafff5";
  ctx.font = "700 20px monospace";
  ctx.fillText(">_", game.playerX - 16, playerY + 1);

  ctx.fillStyle = "#c9d7d1";
  ctx.font = "700 15px monospace";
  ctx.fillText(`SCORE ${String(game.score).padStart(4, "0")}`, 24, 28);
  ctx.fillText(`VIES ${"●".repeat(game.lives)}${"○".repeat(3 - game.lives)}`, width - 132, 28);

  if (!game.running) {
    ctx.fillStyle = "rgba(5, 8, 20, 0.82)";
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#71f2b6";
    ctx.font = "800 34px monospace";
    ctx.fillText(game.gameOver ? "PROCESS TERMINATED" : "TERMINAL READY", width / 2, height / 2 - 24);
    ctx.fillStyle = "#d9e7e1";
    ctx.font = "16px monospace";
    ctx.fillText(game.gameOver ? `Score final : ${game.score}` : "Collectez le code. Évitez les erreurs.", width / 2, height / 2 + 22);
    ctx.textAlign = "start";
  }
}
