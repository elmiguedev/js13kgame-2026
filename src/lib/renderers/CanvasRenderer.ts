import type GameObject from "../Object";
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
    object.render(this.context);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  destroy(): void {}
}
