import Game from "../lib/Game";
import RoomController from "./controllers/RoomController";
import GameScene from "./scenes/GameScene";
import LobbyScene from "./scenes/LobbyScene";
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
    LobbyScene,
    GameScene
  ],
  pixelArt: true
});

import.meta.hot.dispose(() => {
  game.destroy();
  RoomController.destroyInstance();
});
