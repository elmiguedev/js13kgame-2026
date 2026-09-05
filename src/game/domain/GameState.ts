import type EnemyState from "./EnemyState";
import type { GameStateType } from "./GameStateType";
import type PlayerState from "./PlayerState";

export default interface GameState {
  status: GameStateType;
  players: ReadonlyMap<string, PlayerState>;
  enemies: ReadonlyMap<string, EnemyState>;
}
