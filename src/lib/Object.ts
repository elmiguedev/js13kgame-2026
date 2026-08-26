import type Position from "./common/Position";

export interface ObjectConfig {
  id?: string;
  x?: number;
  y?: number;
}

let nextObjectId = 0;

export default class Object {
  readonly id: string;
  readonly position: Position;

  constructor({ id, x, y }: ObjectConfig = {}) {
    this.id = id ?? `object-${nextObjectId++}`;
    this.position = { x: x ?? 0, y: y ?? 0 };
  }

  update(_time: number, _delta: number): void { }

  render(_context: CanvasRenderingContext2D): void { }
}
