import type Enemy from "./Enemy";
import type Player from "./Player";

export default interface GameState {
  players: Player[];
  enemies: Enemy[];
}
