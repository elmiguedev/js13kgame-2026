import { Keys } from "../../lib/controllers/KeyboardController";
import Text from "../../lib/entities/Text";
import Scene from "../../lib/Scene";
import GameController from "../controllers/GameController";

export default class LobbyScene extends Scene {
  private readonly gameController = GameController.getInstance();

  constructor() {
    super("LobbyScene");
  }

  override create(): void {
    this.entities.add(new Text({ x: 48, y: 56 }, "LOBBY\n\nPRESS ENTER"));
    this.gameController.gameService.setGameStatus("lobby");
    this.gameController.actions.addPlayer.execute("player1");
  }

  override handleKey(key: string): void {
    if (key === Keys.ENTER) {
      this.scene.start("GameScene");
    }
  }
}
