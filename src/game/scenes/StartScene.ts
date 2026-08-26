import Scene from "../../lib/Scene";
import Text from "../../lib/entities/Text";

export default class StartScene extends Scene {

  constructor() {
    super("StartScene");
  }

  override create(): void {
    this.entities.add(new Text(
      { x: 10, y: 20 }, "Press any key to start"
    ));
  }

  override update(time: number, delta: number): void {

  }
}