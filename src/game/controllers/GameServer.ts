import AddPlayerAction from "../actions/AddPlayerAction";
import MovePlayerAction, { type MovePlayerInput } from "../actions/MovePlayerAction";
import SetPlayerReadyAction from "../actions/SetPlayerReadyAction";
import GridObjectEntity from "../entities/GridObjectEntity";
import MazeBuilder from "../entities/MazeBuilder";
import WorldEntity from "../entities/WorldEntity";
import type GameStateChange from "../events/GameStateChange";
import GameService from "../services/GameService";
import type { ObservableListener } from "../../lib/common/Observable";

export default class GameServer {
  private readonly gameService = new GameService();
  private readonly world = new WorldEntity();
  private readonly mazeBuilder = new MazeBuilder();
  private readonly addPlayerAction = new AddPlayerAction(this.gameService);
  private readonly movePlayerAction = new MovePlayerAction(this.gameService, this.world);
  private readonly setPlayerReadyAction = new SetPlayerReadyAction(this.gameService);

  constructor() {
    this.createMaze();
  }

  onGameStateChange(listener: ObservableListener<GameStateChange>): () => void {
    return this.gameService.onGameStateChange(listener);
  }

  addPlayer(id: string): boolean {
    const object = new GridObjectEntity({ id, position: this.world.findFreePosition(), solid: true });
    if (!this.world.addObject(object)) {
      return false;
    }

    const added = this.addPlayerAction.execute({ id, position: this.world.toWorldPosition(object.position) });
    if (!added) {
      this.world.removeObject(id);
    }
    return added;
  }

  movePlayer(input: MovePlayerInput): boolean {
    return this.movePlayerAction.execute(input);
  }

  setPlayerReady(id: string): boolean {
    return this.setPlayerReadyAction.execute(id);
  }

  private createMaze(): void {
    let index = 0;
    for (const position of this.mazeBuilder.build()) {
      const id = `solid-${index}`;
      const object = new GridObjectEntity({ id, position, solid: true });
      if (this.world.addObject(object)) {
        this.gameService.addSolid({ id, position: this.world.toWorldPosition(position), frame: 2 });
        index += 1;
      }
    }
  }
}
