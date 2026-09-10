import type EnemyState from "./EnemyState";
import type { GameStateType } from "./GameStateType";
import type PlayerState from "./PlayerState";
import type SolidState from "./SolidState";

export default interface GameState {
  status: GameStateType;
  terrainSeed: number;
  players: ReadonlyMap<string, PlayerState>;
  enemies: ReadonlyMap<string, EnemyState>;
  solids: ReadonlyMap<string, SolidState>;
  collectibles: ReadonlyMap<string, CollectibleState>;
  doors: ReadonlyMap<string, DoorState>;
}
import type CollectibleState from "./CollectibleState";
import type DoorState from "./DoorState";
