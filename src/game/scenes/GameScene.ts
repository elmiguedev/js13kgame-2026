import Scene from "../../lib/Scene";
import Text from "../../lib/entities/Text";

export default class GameScene extends Scene {

  constructor() {
    super("GameScene");
  }

  override create(): void {
    this.entities.add(new Text(
      { x: 10, y: 20 }, "GAME SCENE"
    ));
  }

  override update(time: number, delta: number): void {

  }
}