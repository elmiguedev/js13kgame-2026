import type Position from "../../lib/common/Position";

export interface DungeonLayout {
  walls: readonly Position[];
  floors: readonly Position[];
}

export default class MazeBuilder {
  private static readonly radius = 150;
  private static readonly mazeRoomCount = 12;
  private static readonly roomSize = 5;
  private static readonly corridorSize = 2;
  private static readonly start = -42;

  build(): DungeonLayout {
    const walls = this.createWalls();
    const visited = new Set<string>();
    const maxRoomPosition = MazeBuilder.getMaxRoomPosition();
    const carve = (position: Position): void => {
      visited.add(this.getPositionKey(position));
      for (const direction of this.getRandomDirections()) {
        const next = { x: position.x + direction.x * MazeBuilder.getRoomStep(), y: position.y + direction.y * MazeBuilder.getRoomStep() };
        if (next.x < MazeBuilder.start || next.x > maxRoomPosition || next.y < MazeBuilder.start || next.y > maxRoomPosition || visited.has(this.getPositionKey(next))) {
          continue;
        }

        this.carveCorridor(walls, position, next);
        carve(next);
      }
    };

    for (let y = MazeBuilder.start; y <= maxRoomPosition; y += MazeBuilder.getRoomStep()) {
      for (let x = MazeBuilder.start; x <= maxRoomPosition; x += MazeBuilder.getRoomStep()) {
        this.carveRoom(walls, { x, y });
      }
    }
    carve({ x: 0, y: 0 });
    return this.createLayout(walls);
  }

  private createWalls(): Map<string, Position> {
    const walls = new Map<string, Position>();
    const min = MazeBuilder.start - 1;
    const max = MazeBuilder.getMaxRoomPosition() + MazeBuilder.roomSize;
    for (let y = min; y <= max; y += 1) {
      for (let x = min; x <= max; x += 1) {
        walls.set(this.getPositionKey({ x, y }), { x, y });
      }
    }
    return walls;
  }

  private carveRoom(walls: Map<string, Position>, position: Position): void {
    for (let y = position.y; y < position.y + MazeBuilder.roomSize; y += 1) {
      for (let x = position.x; x < position.x + MazeBuilder.roomSize; x += 1) {
        walls.delete(this.getPositionKey({ x, y }));
      }
    }
  }

  private carveCorridor(walls: Map<string, Position>, from: Position, to: Position): void {
    const corridorOffset = Math.floor((MazeBuilder.roomSize - MazeBuilder.corridorSize) / 2);
    if (from.x !== to.x) {
      const x = Math.min(from.x, to.x) + MazeBuilder.roomSize;
      for (let y = from.y + corridorOffset; y < from.y + corridorOffset + MazeBuilder.corridorSize; y += 1) {
        for (let corridorX = x; corridorX < x + MazeBuilder.corridorSize; corridorX += 1) {
          walls.delete(this.getPositionKey({ x: corridorX, y }));
        }
      }
    } else {
      const y = Math.min(from.y, to.y) + MazeBuilder.roomSize;
      for (let x = from.x + corridorOffset; x < from.x + corridorOffset + MazeBuilder.corridorSize; x += 1) {
        for (let corridorY = y; corridorY < y + MazeBuilder.corridorSize; corridorY += 1) {
          walls.delete(this.getPositionKey({ x, y: corridorY }));
        }
      }
    }
  }

  private createLayout(walls: ReadonlyMap<string, Position>): DungeonLayout {
    const min = MazeBuilder.start - 1;
    const max = MazeBuilder.getMaxRoomPosition() + MazeBuilder.roomSize;
    const floors: Position[] = [];
    for (let y = min; y <= max; y += 1) {
      for (let x = min; x <= max; x += 1) {
        const position = { x, y };
        if (!walls.has(this.getPositionKey(position))) {
          floors.push(position);
        }
      }
    }
    const withinRadius = (position: Position): boolean => position.x * position.x + position.y * position.y <= MazeBuilder.radius * MazeBuilder.radius;
    return {
      walls: Array.from(walls.values()).filter(withinRadius),
      floors: floors.filter(withinRadius),
    };
  }

  private getRandomDirections(): Position[] {
    const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
    return this.shuffle(directions);
  }

  private shuffle<T>(values: T[]): T[] {
    const shuffled = [...values];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
    }
    return shuffled;
  }

  private getPositionKey(position: Position): string {
    return `${position.x},${position.y}`;
  }

  private static getRoomStep(): number {
    return this.roomSize + this.corridorSize;
  }

  private static getMaxRoomPosition(): number {
    return this.start + (this.mazeRoomCount - 1) * this.getRoomStep();
  }
}
