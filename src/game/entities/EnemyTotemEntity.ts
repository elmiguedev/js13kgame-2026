import type EnemyTotem from "../domain/EnemyTotem";
import Sprite from "../../lib/entities/Sprite";

export default class EnemyTotemEntity extends Sprite {
  constructor(totem: EnemyTotem) {
    super({
      id: `totem-${totem.id}`,
      x: totem.position.x,
      y: totem.position.y,
      width: 14,
      height: 14,
      color: "#a855f7",
    });
  }

  sync(totem: EnemyTotem): void {
    this.position.x = totem.position.x;
    this.position.y = totem.position.y;
  }
}
