import type { GameStateType } from "../domain/GameStateType";

export default interface GameStatusChange {
  status: GameStateType;
}
