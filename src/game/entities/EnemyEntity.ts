import type Enemy from "../domain/Enemy";
import PixelSprite from "../../lib/entities/PixelSprite";

export default class EnemyEntity extends PixelSprite {
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
  }

  sync(enemy: Enemy): void {
    this.position.x = enemy.position.x;
    this.position.y = enemy.position.y;
  }
}
