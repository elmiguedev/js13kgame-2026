import type Enemy from "../domain/Enemy";
import type Position from "../../lib/common/Position";
import smoothPosition from "../../lib/common/smoothPosition";
import PixelSprite from "../../lib/entities/PixelSprite";

export default class EnemyEntity extends PixelSprite {
  private readonly targetPosition: Position;

  constructor(enemy: Enemy) {
    super({
      id: `enemy-${enemy.id}`,
      x: enemy.position.x,
      y: enemy.position.y,
      palette: {
        1: "#FFFFFF"
      },
      pixels: [
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1]
      ],
      pixelSize: 2
    });
    this.targetPosition = { ...enemy.position };
  }

  sync(enemy: Enemy): void {
    this.targetPosition.x = enemy.position.x;
    this.targetPosition.y = enemy.position.y;
  }

  override update(time: number, delta: number): void {
    super.update(time, delta);
    smoothPosition(this.position, this.targetPosition, delta, 12);
  }
}
