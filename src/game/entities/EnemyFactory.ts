import type Position from "../../lib/common/Position";
import type { SpriteSheetAnimations } from "../../lib/entities/SpriteSheetSprite";
import type { EnemyType } from "../domain/EnemyState";
import Enemy from "./Enemy";

export default class EnemyFactory {
  private static nextId = 0;
  static readonly beholderAnimation: SpriteSheetAnimations = {
    idle: {
      frames: [3, 4],
      frameDuration: 400,
      loop: true,
    },
  };
  static readonly moleAnimation: SpriteSheetAnimations = {
    idle: {
      frames: [5, 6],
      frameDuration: 400,
      loop: true,
    },
  };

  static createBeholder(position: Position): Enemy {
    return new Enemy(`beholder-${this.nextId++}`, position, "beholder", 8);
  }

  static createMole(position: Position): Enemy {
    return new Enemy(`mole-${this.nextId++}`, position, "mole", 3);
  }

  static getAnimation(type: EnemyType): SpriteSheetAnimations {
    return type === "beholder" ? this.beholderAnimation : this.moleAnimation;
  }
}
