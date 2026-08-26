import GameObject, { type ObjectConfig } from "../Object";

export interface SpriteConfig extends ObjectConfig {
  width?: number;
  height?: number;
  color?: string;
}

export default class Sprite extends GameObject {
  readonly width: number;
  readonly height: number;
  color: string;

  constructor({ width = 16, height = 16, color = "#ffffff", ...objectConfig }: SpriteConfig = {}) {
    super(objectConfig);
    this.width = width;
    this.height = height;
    this.color = color;
  }

  override render(context: CanvasRenderingContext2D): void {
    context.fillStyle = this.color;
    context.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
}
