import type GameObject from "../Object";
import type PixelSprite from "../entities/PixelSprite";

export default interface Renderer {
  clear(color: string): void;
  render(object: GameObject): void;
  renderPixelSprite(sprite: PixelSprite): void;
  pushTransform(x: number, y: number): void;
  popTransform(): void;
  resize(width: number, height: number): void;
  destroy(): void;
}
