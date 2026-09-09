import GameObject from "../../lib/Object";
import SpriteSheet from "../../lib/entities/SpriteSheet";
import type DoorState from "../domain/DoorState";

export default class DoorEntity extends GameObject {
  visible = true;
  alpha = 1;
  private readonly width: number;
  private readonly height: number;
  private open: boolean;

  constructor(private readonly spriteSheet: SpriteSheet, state: DoorState) {
    super({ id: state.id, x: state.position.x, y: state.position.y });
    this.width = state.width;
    this.height = state.height;
    this.open = state.open;
  }

  updateState(state: DoorState): void {
    this.position.x = state.position.x;
    this.position.y = state.position.y;
    this.open = state.open;
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
    context.restore();
  }
}
