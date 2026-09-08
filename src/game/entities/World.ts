import type Position from "../../lib/common/Position";
import type { MoveType } from "../domain/MoveType";
import GridObject from "./GridObject";

export default class World {
  private readonly objects = new Map<string, GridObject>();

  constructor(readonly cellSize = 8) {
    if (!Number.isInteger(cellSize) || cellSize <= 0) {
      throw new Error("World cell size must be a positive integer.");
    }
  }

  addObject(object: GridObject): boolean {
    if (this.objects.has(object.id) || (object.solid && this.hasSolidObjectAt(object.position))) {
      return false;
    }

    this.objects.set(object.id, object);
    return true;
  }

  removeObject(id: string): boolean {
    return this.objects.delete(id);
  }

  findFreePosition(): Position {
    let x = 0;
    while (this.hasSolidObjectAt({ x, y: 0 })) {
      x += 1;
    }
    return { x, y: 0 };
  }

  moveObject(id: string, direction: MoveType): Position | undefined {
    const object = this.objects.get(id);
    if (!object) {
      return undefined;
    }

    const position = this.getNextPosition(object.position, direction);
    if (this.hasSolidObjectAt(position)) {
      return undefined;
    }

    object.moveTo(position);
    return this.toWorldPosition(position);
  }

  toWorldPosition(position: Position): Position {
    return { x: position.x * this.cellSize, y: position.y * this.cellSize };
  }

  private hasSolidObjectAt(position: Position): boolean {
    for (const object of this.objects.values()) {
      if (object.solid && object.position.x === position.x && object.position.y === position.y) {
        return true;
      }
    }
    return false;
  }

  private getNextPosition(position: Position, direction: MoveType): Position {
    if (direction === "up") return { x: position.x, y: position.y - 1 };
    if (direction === "down") return { x: position.x, y: position.y + 1 };
    if (direction === "left") return { x: position.x - 1, y: position.y };
    return { x: position.x + 1, y: position.y };
  }
}
