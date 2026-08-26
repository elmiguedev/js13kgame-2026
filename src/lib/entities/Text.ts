import type Position from "../common/Position";
import GameObject, { type ObjectConfig } from "../Object";

export interface TextConfig extends Omit<ObjectConfig, "x" | "y"> {
  color?: string;
  fontSize?: number;
}

export default class Text extends GameObject {
  text: string;
  color: string;
  fontSize: number;
  private raster: HTMLCanvasElement | undefined;
  private rasterKey: string | undefined;

  constructor(position: Position, text: string, config: TextConfig = {}) {
    const { color = "#ffffff", fontSize = 8, hitArea, ...objectConfig } = config;
    super({
      ...objectConfig,
      x: position.x,
      y: position.y,
      hitArea: hitArea ?? { width: text.length * fontSize, height: fontSize },
    });
    this.text = text;
    this.color = color;
    this.fontSize = fontSize;
  }

  override render(context: CanvasRenderingContext2D): void {
    const raster = this.getRaster();
    context.drawImage(raster, Math.round(this.position.x), Math.round(this.position.y));
  }

  private getRaster(): HTMLCanvasElement {
    const font = `${this.fontSize}px monospace`;
    const key = `${this.text}\u0000${this.color}\u0000${font}`;

    if (this.raster && this.rasterKey === key) {
      return this.raster;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D is not available.");
    }

    context.font = font;
    const lines = this.text.split("\n");
    canvas.width = Math.max(1, Math.ceil(Math.max(...lines.map((line) => context.measureText(line).width))));
    canvas.height = this.fontSize * lines.length;

    context.font = font;
    context.fillStyle = this.color;
    context.textBaseline = "top";
    for (const [index, line] of lines.entries()) {
      context.fillText(line, 0, index * this.fontSize);
    }

    // Native canvas text is antialiased. Keep only fully opaque pixels.
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 3; index < image.data.length; index += 4) {
      const alpha = image.data[index];
      if (alpha !== undefined) {
        image.data[index] = alpha < 128 ? 0 : 255;
      }
    }
    context.putImageData(image, 0, 0);

    this.raster = canvas;
    this.rasterKey = key;
    return canvas;
  }
}
