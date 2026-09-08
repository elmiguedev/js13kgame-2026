import type PlayerState from "../domain/PlayerState";
import SpriteSheet from "../../lib/entities/SpriteSheet";
import SpriteSheetSprite from "../../lib/entities/SpriteSheetSprite";

export default class PlayerEntity extends SpriteSheetSprite {
  hp: number;

  constructor(spriteSheet: SpriteSheet, state: PlayerState) {
    super({
      id: state.id,
      x: state.position.x,
      y: state.position.y,
      spriteSheet,
      frame: 0,
      animations: {
        idle: {
          frames: [0, 1],
          frameDuration: 500,
          loop: true,
        },
      },
    });
    this.hp = state.hp;
    this.anims.play("idle");
  }

  updateState(state: PlayerState): number {
    const damage = Math.max(0, this.hp - state.hp);
    this.position.x = state.position.x;
    this.position.y = state.position.y;
    this.hp = state.hp;
    return damage;
  }
}
