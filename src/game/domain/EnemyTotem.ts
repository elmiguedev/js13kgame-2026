import type Position from "../../lib/common/Position";

export default interface EnemyTotem {
  id: string;
  position: Position;
  maxEnemies: number;
  spawnInterval: number;
  spawnRadius: number;
}
