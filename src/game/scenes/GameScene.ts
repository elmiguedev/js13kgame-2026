import { Keys } from "../../lib/controllers/KeyboardController";
import SpriteSheet from "../../lib/entities/SpriteSheet";
import SpriteSheetSprite from "../../lib/entities/SpriteSheetSprite";
import Text from "../../lib/entities/Text";
import Scene from "../../lib/Scene";

export default class GameScene extends Scene {
  constructor() {
    super("GameScene");
  }

  override create(): void {
    this.entities.add(new Text({ x: 52, y: 56 }, "DUNGEON\n\nPRESS ENTER"));


    const spriteSheet = new SpriteSheet("./spritesheet.png", 8, 8, 8, 8);
    const testSprite = new SpriteSheetSprite({
      x: 100,
      y: 100,
      spriteSheet,
      frame: 0,
      width: 8,
      height: 8,
      animations: {
        idle: {
          frames: [0, 1],
          frameDuration: 400,
          loop: true,
        },
      }

    });

    testSprite.anims.play("idle");
    this.entities.add(testSprite);

  }

  override handleKey(key: string): void {
    if (key === Keys.ENTER) {
      this.scene.start("StartScene");
    }
  }
}
