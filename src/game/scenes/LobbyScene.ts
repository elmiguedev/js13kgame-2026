import { Keys } from "../../lib/controllers/KeyboardController";
import Text from "../../lib/entities/Text";
import Scene from "../../lib/Scene";

export default class LobbyScene extends Scene {
  constructor() {
    super("LobbyScene");
  }

  override create(): void {
    this.entities.add(new Text({ x: 48, y: 56 }, "LOBBY\n\nPRESS ENTER"));
  }

  override handleKey(key: string): void {
    if (key === Keys.ENTER) {
      this.scene.start("GameScene");
    }
  }
}
