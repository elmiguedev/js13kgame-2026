import type Position from "../../lib/common/Position";
import type { GemColor } from "../domain/GemColor";

interface GemSpawn {
  color: Exclude<GemColor, "violet">;
  position: Position;
}

export interface DungeonLayout {
  walls: readonly Position[];
  floors: readonly Position[];
  gems: readonly GemSpawn[];
  enemyPositions: readonly Position[];
  playerSpawnFloors: readonly Position[];
  bossPosition: Position;
  door: { position: Position; width: number; height: number };
}

export default class MazeBuilder {
  private static readonly roomSize = 5;
  private static readonly roomStep = 7;

  build(): DungeonLayout {
    const playerRoom = { x: 0, y: -7 };
    const bossRoom = { x: 0, y: 0 };
    const gemRooms = [
      { color: "red", position: { x: -7, y: -14 } },
      { color: "orange", position: { x: 0, y: -14 } },
      { color: "yellow", position: { x: 7, y: -14 } },
      { color: "green", position: { x: -7, y: -7 } },
      { color: "blue", position: { x: 7, y: -7 } },
      { color: "indigo", position: { x: -7, y: 0 } },
    ] as const;
    const floors = new Map<string, Position>();
    for (const room of [playerRoom, bossRoom, ...gemRooms.map((room) => room.position)]) {
      this.carveRoom(floors, room);
    }
    for (const [from, to] of [
      [playerRoom, bossRoom],
      [playerRoom, gemRooms[1]!.position],
      [playerRoom, gemRooms[3]!.position],
      [playerRoom, gemRooms[4]!.position],
      [gemRooms[3]!.position, gemRooms[0]!.position],
      [gemRooms[1]!.position, gemRooms[2]!.position],
      [gemRooms[3]!.position, gemRooms[5]!.position],
    ] as const) {
      this.carveCorridor(floors, from, to);
    }

    return {
      walls: this.createWalls(floors),
      floors: Array.from(floors.values()),
      gems: gemRooms.map(({ color, position }) => ({ color, position: { x: position.x + 3, y: position.y + 3 } })),
      enemyPositions: gemRooms.map(({ position }) => ({ x: position.x + 1, y: position.y + 1 })),
      playerSpawnFloors: [
        { x: 2, y: -5 },
        { x: 1, y: -5 },
        { x: 3, y: -5 },
        { x: 2, y: -6 },
        { x: 2, y: -4 },
      ],
      bossPosition: { x: 1, y: 1 },
      door: { position: { x: 1, y: -1 }, width: 2, height: 1 },
    };
  }

  private carveRoom(floors: Map<string, Position>, position: Position): void {
    for (let y = position.y; y < position.y + MazeBuilder.roomSize; y += 1) {
      for (let x = position.x; x < position.x + MazeBuilder.roomSize; x += 1) {
        this.addFloor(floors, { x, y });
      }
    }
  }

  private carveCorridor(floors: Map<string, Position>, from: Position, to: Position): void {
    if (from.x !== to.x) {
      const x = Math.min(from.x, to.x) + MazeBuilder.roomSize;
      for (let y = from.y + 1; y < from.y + 3; y += 1) {
        for (let corridorX = x; corridorX < x + 2; corridorX += 1) {
          this.addFloor(floors, { x: corridorX, y });
        }
      }
      return;
    }

    const y = Math.min(from.y, to.y) + MazeBuilder.roomSize;
    for (let x = from.x + 1; x < from.x + 3; x += 1) {
      for (let corridorY = y; corridorY < y + 2; corridorY += 1) {
        this.addFloor(floors, { x, y: corridorY });
      }
    }
  }

  private createWalls(floors: ReadonlyMap<string, Position>): Position[] {
    const walls: Position[] = [];
    for (let y = -15; y <= 5; y += 1) {
      for (let x = -8; x <= 12; x += 1) {
        const position = { x, y };
        if (!floors.has(this.getPositionKey(position))) {
          walls.push(position);
        }
      }
    }
    return walls;
  }

  private addFloor(floors: Map<string, Position>, position: Position): void {
    floors.set(this.getPositionKey(position), position);
  }

  private getPositionKey(position: Position): string {
    return `${position.x},${position.y}`;
  }
}
