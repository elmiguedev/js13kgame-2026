import type GameState from "../domain/GameState";

export default interface GameStateChange {
  state: GameState;
}
