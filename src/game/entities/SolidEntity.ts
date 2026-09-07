import SpriteSheet from "../../lib/entities/SpriteSheet";
import SpriteSheetSprite from "../../lib/entities/SpriteSheetSprite";
import type SolidState from "../domain/SolidState";

export default class SolidEntity extends SpriteSheetSprite {
  constructor(spriteSheet: SpriteSheet, state: SolidState) {
    super({
      id: state.id,
      x: state.position.x,
      y: state.position.y,
      spriteSheet,
      frame: state.frame,
    });
  }

  updateState(state: SolidState): void {
    this.position.x = state.position.x;
    this.position.y = state.position.y;
    this.setFrame(state.frame);
  }
}
