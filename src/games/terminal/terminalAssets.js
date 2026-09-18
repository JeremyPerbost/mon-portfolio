import bullet from "./assets/balle.png";
import wallBottomRight from "./assets/mur_bas_droit.png";
import wallBottomLeft from "./assets/mur_bas_gauche.png";
import wallTopRight from "./assets/mur_haut_droit.png";
import wallTopLeft from "./assets/mur_haut_gauche.png";
import wallHorizontal from "./assets/mur_horizontal.png";
import wallVertical from "./assets/mur_vertical.png";
import enemyDown from "./assets/soldat_ennemi_down.png";
import enemyLeft from "./assets/soldat_ennemi_left.png";
import enemyRight from "./assets/soldat_ennemi_right.png";
import enemyUp from "./assets/soldat_ennemi_up.png";
import playerDown from "./assets/spritesheet_player/player_down.png";
import playerLeft from "./assets/spritesheet_player/player_left.png";
import playerRight from "./assets/spritesheet_player/player_right.png";
import playerUp from "./assets/spritesheet_player/player_up.png";
import playerShotDown from "./assets/spritesheet_player/player_shot_down.png";
import playerShotLeft from "./assets/spritesheet_player/player_shot_left.png";
import playerShotRight from "./assets/spritesheet_player/player_shot_right.png";
import playerShotUp from "./assets/spritesheet_player/player_shot_up.png";

const sources = {
  bullet,
  wallBottomRight,
  wallBottomLeft,
  wallTopRight,
  wallTopLeft,
  wallHorizontal,
  wallVertical,
  enemyDown,
  enemyLeft,
  enemyRight,
  enemyUp,
  playerDown,
  playerLeft,
  playerRight,
  playerUp,
  playerShotDown,
  playerShotLeft,
  playerShotRight,
  playerShotUp,
};

function removeWallBackground(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    if (pixels.data[index] === 34 && pixels.data[index + 1] === 35 && pixels.data[index + 2] === 35) pixels.data[index + 3] = 0;
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
}

function createWallMasks(assets) {
  const cornerAssets = {
    5: assets.wallTopLeft,
    6: assets.wallTopRight,
    9: assets.wallBottomLeft,
    10: assets.wallBottomRight,
  };
  return Array.from({ length: 16 }, (_, mask) => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext("2d");
    if (cornerAssets[mask]) {
      context.drawImage(cornerAssets[mask], 0, 0);
      return canvas;
    }
    if (mask & 1) context.drawImage(assets.wallHorizontal, 0, 0, 18, 32, 0, 0, 18, 32);
    if (mask & 2) context.drawImage(assets.wallHorizontal, 14, 0, 18, 32, 14, 0, 18, 32);
    if (mask & 4) context.drawImage(assets.wallVertical, 0, 0, 32, 18, 0, 0, 32, 18);
    if (mask & 8) context.drawImage(assets.wallVertical, 0, 14, 32, 18, 0, 14, 32, 18);
    if (mask === 0) {
      context.fillStyle = "#f0f6f0";
      context.fillRect(14, 14, 4, 4);
    }
    return canvas;
  });
}

export function loadTerminalAssets() {
  return Promise.all(Object.entries(sources).map(([name, source]) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve([name, name.startsWith("wall") ? removeWallBackground(image) : image]);
    image.onerror = reject;
    image.src = source;
  }))).then((entries) => {
    const assets = Object.fromEntries(entries);
    assets.wallMasks = createWallMasks(assets);
    return assets;
  });
}
