import type GameObject from "../Object";
import PixelSprite from "../entities/PixelSprite";
import type Renderer from "./Renderer";

export interface CanvasRendererConfig {
  pixelArt?: boolean;
}

export default class CanvasRenderer implements Renderer {
  readonly context: CanvasRenderingContext2D;

  constructor(readonly canvas: HTMLCanvasElement, { pixelArt = true }: CanvasRendererConfig = {}) {
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D is not available.");
    }

    this.context = context;
    this.context.imageSmoothingEnabled = !pixelArt;
    this.canvas.style.imageRendering = pixelArt ? "pixelated" : "auto";
  }

  clear(color: string): void {
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(object: GameObject): void {
    if (object instanceof PixelSprite) {
      this.renderPixelSprite(object);
    } else {
      object.render(this.context);
    }
  }

  renderPixelSprite(sprite: PixelSprite): void {
    const x = Math.round(sprite.position.x);
    const y = Math.round(sprite.position.y);
    let currentColor: string | undefined;

    for (const [rowIndex, row] of sprite.pixels.entries()) {
      for (const [columnIndex, paletteIndex] of row.entries()) {
        const color = sprite.palette[paletteIndex];
        if (color === undefined) {
          continue;
        }

        if (color !== currentColor) {
          this.context.fillStyle = color;
          currentColor = color;
        }
        this.context.fillRect(
          x + columnIndex * sprite.pixelSize,
          y + rowIndex * sprite.pixelSize,
          sprite.pixelSize,
          sprite.pixelSize,
        );
      }
    }
  }

  pushTransform(x: number, y: number): void {
    this.context.save();
    this.context.translate(x, y);
  }

  popTransform(): void {
    this.context.restore();
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  destroy(): void {}
}
