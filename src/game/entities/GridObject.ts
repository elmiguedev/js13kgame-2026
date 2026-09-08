import type Position from "../../lib/common/Position";

export interface GridObjectConfig {
  id: string;
  position: Position;
  solid?: boolean;
  width?: number;
  height?: number;
}

export default class GridObject {
  readonly id: string;
  readonly solid: boolean;
  readonly position: Position;
  readonly width: number;
  readonly height: number;

  constructor({ id, position, solid = false, width = 1, height = 1 }: GridObjectConfig) {
    this.id = id;
    this.solid = solid;
    this.position = { ...position };
    this.width = width;
    this.height = height;
  }

  moveTo(position: Position): void {
    this.position.x = position.x;
    this.position.y = position.y;
  }

  occupies(position: Position): boolean {
    return position.x >= this.position.x
      && position.x < this.position.x + this.width
      && position.y >= this.position.y
      && position.y < this.position.y + this.height;
  }
}
