import AddPlayerAction from "../actions/AddPlayerAction";
import MovePlayerAction, { type MovePlayerInput } from "../actions/MovePlayerAction";
import SetPlayerReadyAction from "../actions/SetPlayerReadyAction";
import type GameStateChange from "../events/GameStateChange";
import GameService from "../services/GameService";
import type { ObservableListener } from "../../lib/common/Observable";

export default class GameServer {
  private readonly gameService = new GameService();
  private readonly addPlayerAction = new AddPlayerAction(this.gameService);
  private readonly movePlayerAction = new MovePlayerAction(this.gameService);
  private readonly setPlayerReadyAction = new SetPlayerReadyAction(this.gameService);

  onGameStateChange(listener: ObservableListener<GameStateChange>): () => void {
    return this.gameService.onGameStateChange(listener);
  }

  addPlayer(id: string): boolean {
    return this.addPlayerAction.execute(id);
  }

  movePlayer(input: MovePlayerInput): boolean {
    return this.movePlayerAction.execute(input);
  }

  setPlayerReady(id: string): boolean {
    return this.setPlayerReadyAction.execute(id);
  }
}
