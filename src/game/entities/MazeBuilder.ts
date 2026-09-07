import type Position from "../../lib/common/Position";

export default class MazeBuilder {
  private static readonly radius = 50;
  private static readonly roomCount = 6;
  private static readonly start = -4;

  build(): readonly Position[] {
    const walls = this.createWalls();
    const visited = new Set<string>();
    const maxRoomPosition = MazeBuilder.start + MazeBuilder.roomCount * 2 - 2;
    const carve = (position: Position): void => {
      visited.add(this.getPositionKey(position));
      for (const direction of this.getRandomDirections()) {
        const next = { x: position.x + direction.x * 2, y: position.y + direction.y * 2 };
        if (next.x < MazeBuilder.start || next.x > maxRoomPosition || next.y < MazeBuilder.start || next.y > maxRoomPosition || visited.has(this.getPositionKey(next))) {
          continue;
        }

        walls.delete(this.getPositionKey({ x: position.x + direction.x, y: position.y + direction.y }));
        carve(next);
      }
    };

    carve({ x: 0, y: 0 });
    return Array.from(walls.values()).filter((position) => (
      position.x * position.x + position.y * position.y <= MazeBuilder.radius * MazeBuilder.radius
    ));
  }

  private createWalls(): Map<string, Position> {
    const walls = new Map<string, Position>();
    const min = MazeBuilder.start - 1;
    const max = MazeBuilder.start + MazeBuilder.roomCount * 2 - 1;
    for (let y = min; y <= max; y += 1) {
      for (let x = min; x <= max; x += 1) {
        if (x === min || x === max || y === min || y === max || x % 2 !== 0 || y % 2 !== 0) {
          walls.set(this.getPositionKey({ x, y }), { x, y });
        }
      }
    }
    return walls;
  }

  private getRandomDirections(): Position[] {
    const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
    for (let index = directions.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [directions[index], directions[swapIndex]] = [directions[swapIndex]!, directions[index]!];
    }
    return directions;
  }

  private getPositionKey(position: Position): string {
    return `${position.x},${position.y}`;
  }
}
