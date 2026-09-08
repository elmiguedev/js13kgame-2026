import type Position from "../common/Position";
import Text, { type TextConfig } from "./Text";

export interface FloatingTextConfig extends TextConfig {
  duration?: number;
  rise?: number;
  onComplete?: (text: FloatingText) => void;
}

export default class FloatingText extends Text {
  private elapsed = 0;
  private readonly duration: number;
  private readonly rise: number;
  private readonly onComplete: ((text: FloatingText) => void) | undefined;

  constructor(position: Position, text: string, { duration = 1000, rise = 8, onComplete, ...config }: FloatingTextConfig = {}) {
    super(position, text, config);
    this.duration = duration;
    this.rise = rise;
    this.onComplete = onComplete;
  }

  override update(_time: number, delta: number): void {
    const step = Math.min(delta, this.duration - this.elapsed);
    if (step <= 0) {
      return;
    }

    this.elapsed += step;
    this.position.y -= this.rise * step / this.duration;
    if (this.elapsed === this.duration) {
      this.onComplete?.(this);
    }
  }

  override render(context: CanvasRenderingContext2D): void {
    context.save();
    context.globalAlpha *= 1 - this.elapsed / this.duration;
    super.render(context);
    context.restore();
  }
}
