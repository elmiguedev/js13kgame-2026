import SpriteSheet from "../../lib/entities/SpriteSheet";
import SpriteSheetSprite, { type SpriteSheetAnimations } from "../../lib/entities/SpriteSheetSprite";
import type EnemyState from "../domain/EnemyState";

export default class EnemyEntity extends SpriteSheetSprite {
  hp: number;

  constructor(spriteSheet: SpriteSheet, state: EnemyState, animations: SpriteSheetAnimations) {
    const [animationName, animation] = Object.entries(animations)[0] ?? [];
    if (!animationName || !animation) {
      throw new Error("Enemy entities need an animation.");
    }

    super({
      id: state.id,
      x: state.position.x,
      y: state.position.y,
      spriteSheet,
      frame: animation.frames[0]!,
      width: state.width * 8,
      height: state.height * 8,
      sourceWidth: state.width * 8,
      sourceHeight: state.height * 8,
      animations,
    });
    this.hp = state.hp;
    this.anims.play(animationName);
  }

  updateState(state: EnemyState): number {
    const damage = Math.max(0, this.hp - state.hp);
    this.position.x = state.position.x;
    this.position.y = state.position.y;
    this.hp = state.hp;
    return damage;
  }
}
