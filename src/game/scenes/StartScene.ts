import Scene from "../../lib/Scene";
import { Keys, type Key } from "../../lib/controllers/KeyboardController";
import Text from "../../lib/entities/Text";

export default class StartScene extends Scene {

  private startKey!: Key;

  constructor() {
    super("StartScene");
  }

  override create(): void {
    this.entities.add(new Text(
      { x: 10, y: 20 }, "Press any key to start"
    ));

    this.startKey = this.input.keyboard.addKey(Keys.ENTER);


  }

  override update(time: number, delta: number): void {
    if (this.startKey.isDown) {
      console.log("Starting game...");
      this.scene.start("GameScene");
    }
  }
}