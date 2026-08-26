import type GameObject from "../Object";

export default interface Renderer {
  clear(color: string): void;
  render(object: GameObject): void;
  pushTransform(x: number, y: number): void;
  popTransform(): void;
  resize(width: number, height: number): void;
  destroy(): void;
}
