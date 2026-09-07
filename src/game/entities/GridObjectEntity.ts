import type Position from "../../lib/common/Position";

export interface GridObjectConfig {
  id: string;
  position: Position;
  solid?: boolean;
}

export default class GridObjectEntity {
  readonly id: string;
  readonly solid: boolean;
  readonly position: Position;

  constructor({ id, position, solid = false }: GridObjectConfig) {
    this.id = id;
    this.solid = solid;
    this.position = { ...position };
  }

  moveTo(position: Position): void {
    this.position.x = position.x;
    this.position.y = position.y;
  }
}
