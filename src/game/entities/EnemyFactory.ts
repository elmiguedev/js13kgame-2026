import type Position from "../../lib/common/Position";
import type { SpriteSheetAnimations } from "../../lib/entities/SpriteSheetSprite";
import Enemy from "./Enemy";

export default class EnemyFactory {
  private static nextId = 0;
  static readonly genericMonsterAnimation: SpriteSheetAnimations = {
    idle: {
      frames: [3, 4],
      frameDuration: 400,
      loop: true,
    },
  };

  static createGenericMonster(position: Position): Enemy {
    return new Enemy(`enemy-${this.nextId++}`, position, 2, 4);
  }
}
