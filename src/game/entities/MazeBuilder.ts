import type Position from "../../lib/common/Position";
import type { GemColor } from "../domain/GemColor";

export interface TotemSpawn {
  color: GemColor;
  position: Position;
}

export interface DungeonLayout {
  walls: readonly Position[];
  floors: readonly Position[];
  enemyPositions: readonly Position[];
  totemSpawns: readonly TotemSpawn[];
  playerSpawnFloors: readonly Position[];
  bossPosition: Position;
  door: { position: Position; width: number; height: number };
}

export default class MazeBuilder {
  private static readonly size = 150;
  private static readonly enemyCount = 12;
  private static readonly bossRoom = { x: 65, y: 76 };
  private static readonly totemSpawns: readonly TotemSpawn[] = [
    { color: "red", position: { x: 143, y: 42 } },
    { color: "orange", position: { x: 18, y: 62 } },
    { color: "yellow", position: { x: 132, y: 92 } },
    { color: "green", position: { x: 11, y: 95 } },
    { color: "blue", position: { x: 72, y: 103 } },
    { color: "indigo", position: { x: 120, y: 116 } },
    { color: "violet", position: { x: 27, y: 117 } },
  ];

  build(): DungeonLayout {
    const walls = this.createWalls();
    const wallKeys = new Set(walls.map((position) => this.getPositionKey(position)));
    const floors: Position[] = [];
    for (let y = 1; y < MazeBuilder.size - 1; y += 1) {
      for (let x = 1; x < MazeBuilder.size - 1; x += 1) {
        const position = { x, y };
        if (!wallKeys.has(this.getPositionKey(position))) {
          floors.push(position);
        }
      }
    }

    const bossPosition = { x: 68, y: 79 };
    return {
      walls,
      floors,
      enemyPositions: this.createEnemyPositions(bossPosition),
      totemSpawns: MazeBuilder.totemSpawns,
      playerSpawnFloors: [{ x: 69, y: 35 }, { x: 68, y: 35 }, { x: 70, y: 35 }, { x: 69, y: 34 }, { x: 69, y: 36 }],
      bossPosition,
      door: { position: { x: 68, y: 75 }, width: 2, height: 1 },
    };
  }

  private createWalls(): Position[] {
    const walls = new Map<string, Position>();
    const addWall = (position: Position): void => {
      walls.set(this.getPositionKey(position), position);
    };
    for (let index = 0; index < MazeBuilder.size; index += 1) {
      addWall({ x: index, y: 0 });
      addWall({ x: index, y: MazeBuilder.size - 1 });
      addWall({ x: 0, y: index });
      addWall({ x: MazeBuilder.size - 1, y: index });
    }

    const room = MazeBuilder.bossRoom;
    for (let index = 0; index < 9; index += 1) {
      if (index !== 3 && index !== 4) {
        addWall({ x: room.x + index, y: room.y - 1 });
      }
      addWall({ x: room.x + index, y: room.y + 9 });
      addWall({ x: room.x - 1, y: room.y + index });
      addWall({ x: room.x + 9, y: room.y + index });
    }
    return Array.from(walls.values());
  }

  private createEnemyPositions(boss: Position): Position[] {
    const positions: Position[] = [];
    const occupied = new Set(MazeBuilder.totemSpawns.map((spawn) => this.getPositionKey(spawn.position)));
    occupied.add("69,35");
    while (positions.length < MazeBuilder.enemyCount) {
      const position = {
        x: 1 + Math.floor(Math.random() * (MazeBuilder.size - 2)),
        y: 1 + Math.floor(Math.random() * (MazeBuilder.size - 2)),
      };
      const key = this.getPositionKey(position);
      if (occupied.has(key) || (Math.abs(position.x - boss.x) < 7 && Math.abs(position.y - boss.y) < 7)) {
        continue;
      }
      occupied.add(key);
      positions.push(position);
    }
    return positions;
  }

  private getPositionKey(position: Position): string {
    return `${position.x},${position.y}`;
  }
}
