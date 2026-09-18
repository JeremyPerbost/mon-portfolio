import bullet from "./assets/balle.png";
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

export function loadTerminalAssets() {
  return Promise.all(Object.entries(sources).map(([name, source]) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve([name, image]);
    image.onerror = reject;
    image.src = source;
  }))).then((entries) => Object.fromEntries(entries));
}
