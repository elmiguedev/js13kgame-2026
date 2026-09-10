import type Position from "../../lib/common/Position";
import type { SpriteSheetAnimations } from "../../lib/entities/SpriteSheetSprite";
import type { EnemyType } from "../domain/EnemyState";
import type { GemColor } from "../domain/GemColor";
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
  static readonly bossAnimation: SpriteSheetAnimations = {
    idle: {
      frames: [8, 10],
      frameDuration: 400,
      loop: true,
    },
  };
  static readonly totemAnimation: SpriteSheetAnimations = {
    idle: {
      frames: [32],
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

  static createBoss(position: Position): Enemy {
    return new Enemy(`boss-${this.nextId++}`, position, "boss", 20, 6, 2, 2);
  }

  static createTotem(position: Position, loot: GemColor): Enemy {
    return new Enemy(`totem-${this.nextId++}`, position, "totem", 20, 0, 1, 1, loot);
  }

  static getAnimation(type: EnemyType): SpriteSheetAnimations {
    return type === "beholder" ? this.beholderAnimation : type === "boss" ? this.bossAnimation : type === "totem" ? this.totemAnimation : this.moleAnimation;
  }
}
