import type Position from "../../lib/common/Position";
import type { MoveType } from "../domain/MoveType";
import GridObject from "./GridObject";

export default class World {
  private readonly objects = new Map<string, GridObject>();

  constructor(readonly cellSize = 8) {}

  addObject(object: GridObject): boolean {
    if (this.objects.has(object.id) || (object.solid && !this.canOccupy(object, object.position))) {
      return false;
    }

    this.objects.set(object.id, object);
    return true;
  }

  removeObject(id: string): boolean {
    return this.objects.delete(id);
  }

  getObject(id: string): GridObject | undefined {
    return this.objects.get(id);
  }

  getAdjacentObjects(id: string): GridObject[] {
    const object = this.objects.get(id);
    return object ? Array.from(this.objects.values()).filter((target) => target.id !== id && this.areAdjacent(object, target)) : [];
  }

  getOverlappingObjects(id: string): GridObject[] {
    const object = this.objects.get(id);
    return object ? Array.from(this.objects.values()).filter((target) => target.id !== id && this.overlaps(object, target)) : [];
  }

  findFreePosition(excludedId?: string, positions?: Iterable<Position>): Position {
    if (positions) {
      for (const position of positions) {
        if (!this.hasSolidObjectAt(position, excludedId)) {
          return { ...position };
        }
      }
    }

    let x = 0;
    while (this.hasSolidObjectAt({ x, y: 0 }, excludedId)) {
      x += 1;
    }
    return { x, y: 0 };
  }

  areAdjacent(first: GridObject, second: GridObject): boolean {
    const overlapsHorizontally = first.position.x < second.position.x + second.width
      && second.position.x < first.position.x + first.width;
    const overlapsVertically = first.position.y < second.position.y + second.height
      && second.position.y < first.position.y + first.height;
    return (overlapsHorizontally && (first.position.y + first.height === second.position.y || second.position.y + second.height === first.position.y))
      || (overlapsVertically && (first.position.x + first.width === second.position.x || second.position.x + second.width === first.position.x));
  }

  private overlaps(first: GridObject, second: GridObject): boolean {
    return first.position.x < second.position.x + second.width
      && second.position.x < first.position.x + first.width
      && first.position.y < second.position.y + second.height
      && second.position.y < first.position.y + first.height;
  }

  moveObject(id: string, direction: MoveType): Position | undefined {
    const object = this.objects.get(id);
    if (!object) {
      return undefined;
    }

    const position = this.getNextPosition(object.position, direction);
    if (!this.canOccupy(object, position, object.id)) {
      return undefined;
    }

    object.moveTo(position);
    return this.toWorldPosition(position);
  }

  moveObjectTo(id: string, position: Position): Position | undefined {
    const object = this.objects.get(id);
    if (!object || !this.canOccupy(object, position, object.id)) {
      return undefined;
    }

    object.moveTo(position);
    return this.toWorldPosition(position);
  }

  toWorldPosition(position: Position): Position {
    return { x: position.x * this.cellSize, y: position.y * this.cellSize };
  }

  private hasSolidObjectAt(position: Position, excludedId?: string): boolean {
    return Boolean(this.getObjectAt(position, true, excludedId));
  }

  private canOccupy(object: GridObject, position: Position, excludedId?: string): boolean {
    for (let y = position.y; y < position.y + object.height; y += 1) {
      for (let x = position.x; x < position.x + object.width; x += 1) {
        if (this.hasSolidObjectAt({ x, y }, excludedId)) {
          return false;
        }
      }
    }
    return true;
  }

  private getObjectAt(position: Position, solidOnly = false, excludedId?: string): GridObject | undefined {
    for (const object of this.objects.values()) {
      if (object.id !== excludedId && (!solidOnly || object.solid) && object.occupies(position)) {
        return object;
      }
    }
    return undefined;
  }

  private getNextPosition(position: Position, direction: MoveType): Position {
    if (direction === "up") return { x: position.x, y: position.y - 1 };
    if (direction === "down") return { x: position.x, y: position.y + 1 };
    if (direction === "left") return { x: position.x - 1, y: position.y };
    return { x: position.x + 1, y: position.y };
  }
}
