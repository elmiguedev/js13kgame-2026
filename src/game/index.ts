import Game from "../lib/Game";
import GameScene from "./scenes/GameScene";
import StartScene from "./scenes/StartScene";

import.meta.hot.accept();

const game = new Game({
  resolution: {
    width: 128,
    height: 128
  },
  zoom: 3,
  scenes: [
    StartScene,
    GameScene
  ],
  pixelArt: true
});

import.meta.hot.dispose(() => game.destroy());
