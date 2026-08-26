import Scene from "../../lib/Scene";
import { Keys, type Key } from "../../lib/controllers/KeyboardController";
import Sprite from "../../lib/entities/Sprite";
import Text from "../../lib/entities/Text";

export default class GameScene extends Scene {

  private player!: Sprite;
  private keys!: {
    up: Key;
    down: Key;
    left: Key;
    right: Key;
  };

  constructor() {
    super("GameScene");
  }

  override create(): void {
    this.createControllers();
    this.createPlayer();
  }

  private createControllers() {
    this.keys = {
      up: this.input.keyboard.addKey(Keys.ARROW_UP),
      down: this.input.keyboard.addKey(Keys.ARROW_DOWN),
      left: this.input.keyboard.addKey(Keys.ARROW_LEFT),
      right: this.input.keyboard.addKey(Keys.ARROW_RIGHT)
    };
  }

  private createPlayer() {
    this.player = new Sprite({
      width: 8,
      height: 8,
      color: "#ff0000",
      x: 64,
      y: 64
    });
    this.entities.add(this.player);
  }

  override update(time: number, delta: number): void {
    if (this.keys.up.isDown) {
      this.player.position.y -= 2;
    }
    if (this.keys.down.isDown) {
      this.player.position.y += 2;
    }
    if (this.keys.left.isDown) {
      this.player.position.x -= 2;
    }
    if (this.keys.right.isDown) {
      this.player.position.x += 2;
    }
  }
}