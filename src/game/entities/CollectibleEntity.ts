import SpriteSheet from "../../lib/entities/SpriteSheet";
import SpriteSheetSprite from "../../lib/entities/SpriteSheetSprite";
import type CollectibleState from "../domain/CollectibleState";
import { GEM_COLORS } from "../domain/GemColor";

export default class CollectibleEntity extends SpriteSheetSprite {
  constructor(spriteSheet: SpriteSheet, state: CollectibleState) {
    super({
      id: state.id,
      x: state.position.x,
      y: state.position.y,
      spriteSheet,
      frame: 24 + GEM_COLORS.indexOf(state.color),
    });
  }

  updateState(state: CollectibleState): void {
    this.position.x = state.position.x;
    this.position.y = state.position.y;
  }
}
