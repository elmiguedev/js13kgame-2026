import AddPlayerAction from "../actions/AddPlayerAction";
import MovePlayerAction from "../actions/MovePlayerAction";
import type GameStateChange from "../events/GameStateChange";
import type GameStatusChange from "../events/GameStatusChange";
import GameService from "../services/GameService";
import Observable, { type ObservableListener } from "../../lib/common/Observable";

export default class GameController {
  private static instance: GameController | undefined;
  readonly gameService = new GameService();
  readonly actions = {
    addPlayer: new AddPlayerAction(this.gameService),
    movePlayer: new MovePlayerAction(this.gameService),
  };
  private readonly gameStateChanges = new Observable<GameStateChange>();
  private readonly gameStatusChanges = new Observable<GameStatusChange>();

  static getInstance(): GameController {
    return this.instance ??= new GameController();
  }

  private constructor() {
    this.gameService.onGameStateChange((event) => this.gameStateChanges.emit(event));
    this.gameService.onGameStatusChange((event) => this.gameStatusChanges.emit(event));
  }

  onGameStateChange(listener: ObservableListener<GameStateChange>): () => void {
    return this.gameStateChanges.subscribe(listener);
  }

  onGameStatusChange(listener: ObservableListener<GameStatusChange>): () => void {
    return this.gameStatusChanges.subscribe(listener);
  }
}
