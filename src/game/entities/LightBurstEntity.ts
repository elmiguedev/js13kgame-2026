import type Position from "../../lib/common/Position";
import GameObject from "../../lib/Object";

export default class LightBurstEntity extends GameObject {
  private static readonly sparks = [[-8, -3, 0], [7, -5, 0.1], [-5, -11, 0.2], [4, -14, 0.25], [-10, -16, 0.35], [10, -18, 0.4], [-2, -21, 0.5], [6, -25, 0.55]] as const;
  private elapsed = 0;
  private completed = false;

  constructor(position: Position, private readonly colors: readonly string[], private readonly duration: number, private readonly onComplete: (light: LightBurstEntity) => void) {
    super({ x: position.x, y: position.y });
  }

  override update(_time: number, delta: number): void {
    this.elapsed = Math.min(this.elapsed + delta, this.duration);
    if (this.elapsed === this.duration && !this.completed) {
      this.completed = true;
      this.onComplete(this);
    }
  }

  override render(context: CanvasRenderingContext2D): void {
    const progress = this.elapsed / this.duration;
    context.save();
    context.globalCompositeOperation = "lighter";
    for (const [index, [x, y, delay]] of LightBurstEntity.sparks.entries()) {
      const sparkProgress = (progress - delay) / (1 - delay);
      if (sparkProgress < 0 || sparkProgress > 1) {
        continue;
      }

      context.globalAlpha = 1 - sparkProgress;
      context.fillStyle = this.colors.length === 1 && index % 2 ? "#ffffff" : this.colors[index % this.colors.length]!;
      const size = index % 3 === 0 ? 2 : 1;
      context.fillRect(Math.round(this.position.x + x), Math.round(this.position.y + y - sparkProgress * 6), size, size);
    }
    context.restore();
  }
}
