import type Enemy from "../domain/Enemy";
import Sprite from "../../lib/entities/Sprite";

export default class EnemyEntity extends Sprite {
  constructor(enemy: Enemy) {
    super({
      id: `enemy-${enemy.id}`,
      x: enemy.position.x,
      y: enemy.position.y,
      width: 12,
      height: 12,
      color: "#00ff00",
    });
  }

  sync(enemy: Enemy): void {
    this.position.x = enemy.position.x;
    this.position.y = enemy.position.y;
  }
}
