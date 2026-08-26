import type Position from "../common/Position";
import GameObject from "../Object";

export default class Text extends GameObject {
  readonly text: string;
  color = "#ffffff";
  fontSize = 8;
  private raster: HTMLCanvasElement | undefined;
  private rasterKey: string | undefined;

  constructor(position: Position, text: string) {
    super({ x: position.x, y: position.y });
    this.text = text;
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
    canvas.width = Math.ceil(context.measureText(this.text).width);
    canvas.height = this.fontSize;

    context.font = font;
    context.fillStyle = this.color;
    context.textBaseline = "top";
    context.fillText(this.text, 0, 0);

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
