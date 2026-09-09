import GameObject from "../../lib/Object";
import SpriteSheet from "../../lib/entities/SpriteSheet";
import type DoorState from "../domain/DoorState";
import { GEM_LIGHT_COLORS, type GemColor } from "../domain/GemColor";

export interface DoorUpdate {
  placedGem: boolean;
  opened: boolean;
}

export default class DoorEntity extends GameObject {
  visible = true;
  alpha = 1;
  readonly width: number;
  readonly height: number;
  private open: boolean;
  private placedGems: readonly GemColor[];

  constructor(private readonly spriteSheet: SpriteSheet, state: DoorState) {
    super({ id: state.id, x: state.position.x, y: state.position.y });
    this.width = state.width;
    this.height = state.height;
    this.open = state.open;
    this.placedGems = state.placedGems;
  }

  updateState(state: DoorState): DoorUpdate {
    const placedGem = state.placedGems.length > this.placedGems.length;
    const opened = state.open && !this.open;
    this.position.x = state.position.x;
    this.position.y = state.position.y;
    this.open = state.open;
    this.placedGems = state.placedGems;
    return { placedGem, opened };
  }

  override render(context: CanvasRenderingContext2D): void {
    const image = this.spriteSheet.image;
    if (!this.visible || !image.naturalWidth) {
      return;
    }

    context.save();
    context.globalAlpha *= this.alpha;
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const frame = this.spriteSheet.at((this.open ? 14 : 12) + x);
        context.drawImage(image, frame.x, frame.y, frame.width, frame.height, Math.round(this.position.x + x * 8), Math.round(this.position.y + y * 8), 8, 8);
      }
    }
    for (const [index, gem] of this.placedGems.entries()) {
      context.fillStyle = GEM_LIGHT_COLORS[gem];
      context.fillRect(Math.round(this.position.x + 3 + (index % this.width) * 8), Math.round(this.position.y - 3 - Math.floor(index / this.width) * 3), 2, 2);
    }
    context.restore();
  }
}
