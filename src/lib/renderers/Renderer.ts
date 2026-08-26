import type GameObject from "../Object";

export default interface Renderer {
  clear(color: string): void;
  render(object: GameObject): void;
  resize(width: number, height: number): void;
  destroy(): void;
}
