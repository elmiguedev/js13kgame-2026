import AddPlayerAction from "../actions/AddPlayerAction";
import MovePlayerAction, { type MovePlayerInput } from "../actions/MovePlayerAction";
import SetPlayerReadyAction from "../actions/SetPlayerReadyAction";
import GridObjectEntity from "../entities/GridObjectEntity";
import WorldEntity from "../entities/WorldEntity";
import type GameStateChange from "../events/GameStateChange";
import GameService from "../services/GameService";
import type { ObservableListener } from "../../lib/common/Observable";

export default class GameServer {
  private static readonly mazeRadius = 50;
  private static readonly mazeSolidCount = 96;
  private readonly gameService = new GameService();
  private readonly world = new WorldEntity();
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
    let created = 0;
    let attempts = 0;
    while (created < GameServer.mazeSolidCount && attempts < GameServer.mazeSolidCount * 10) {
      attempts += 1;
      const position = this.getRandomMazePosition();
      if (Math.abs(position.x) <= 1 && Math.abs(position.y) <= 1) {
        continue;
      }

      const id = `solid-${created}`;
      const object = new GridObjectEntity({ id, position, solid: true });
      if (!this.world.addObject(object)) {
        continue;
      }

      this.gameService.addSolid({ id, position: this.world.toWorldPosition(position), frame: 2 });
      created += 1;
    }
  }

  private getRandomMazePosition(): { x: number; y: number } {
    const radius = GameServer.mazeRadius;
    let x = 0;
    let y = 0;
    do {
      x = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
      y = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
    } while (x * x + y * y > radius * radius);
    return { x, y };
  }
}
