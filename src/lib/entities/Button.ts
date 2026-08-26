import Sprite, { type SpriteConfig } from "./Sprite";
import Text from "./Text";

export interface ButtonConfig extends SpriteConfig {
  text: string;
}

export default class Button extends Sprite {
  private readonly label: Text;

  constructor({ text, x = 0, y = 0, width = 64, height = 16, ...config }: ButtonConfig) {
    super({ x, y, width, height, color: "#333333", ...config });
    this.label = new Text({ x: x + 4, y: y + 4 }, text);
  }

  override render(context: CanvasRenderingContext2D): void {
    super.render(context);
    this.label.position.x = this.position.x + 4;
    this.label.position.y = this.position.y + 4;
    this.label.render(context);
  }
}
