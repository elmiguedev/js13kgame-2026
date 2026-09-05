import { Keys } from "../../lib/controllers/KeyboardController";
import Text from "../../lib/entities/Text";
import Scene from "../../lib/Scene";

export default class StartScene extends Scene {
  constructor() {
    super("StartScene");
  }

  override create(): void {
    this.entities.add(new Text({ x: 32, y: 56 }, "RAINBOW RAID\n\nPRESS ENTER"));
  }

  override handleKey(key: string): void {
    if (key === Keys.ENTER) {
      this.scene.start("LobbyScene");
    }
  }
}
