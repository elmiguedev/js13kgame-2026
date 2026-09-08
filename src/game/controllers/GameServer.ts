import type Position from "../../lib/common/Position";
import AddPlayerAction from "../actions/AddPlayerAction";
import AttackPlayerAction from "../actions/AttackPlayerAction";
import EnemyTurnAction from "../actions/EnemyTurnAction";
import MovePlayerAction, { type MovePlayerInput } from "../actions/MovePlayerAction";
import SetPlayerReadyAction from "../actions/SetPlayerReadyAction";
import EnemyFactory from "../entities/EnemyFactory";
import GridObject from "../entities/GridObject";
import MazeBuilder from "../entities/MazeBuilder";
import Player from "../entities/Player";
import World from "../entities/World";
import type GameStateChange from "../events/GameStateChange";
import GameService from "../services/GameService";
import type { ObservableListener } from "../../lib/common/Observable";

export default class GameServer {
  private static readonly moleCount = 20;
  private static readonly beholderCount = 10;
  private readonly gameService = new GameService();
  private readonly world = new World();
  private readonly mazeBuilder = new MazeBuilder();
  private readonly addPlayerAction = new AddPlayerAction(this.gameService);
  private readonly attackPlayerAction = new AttackPlayerAction(this.gameService, this.world);
  private readonly enemyTurnAction = new EnemyTurnAction(this.gameService, this.world);
  private readonly movePlayerAction = new MovePlayerAction(this.gameService, this.world);
  private readonly setPlayerReadyAction = new SetPlayerReadyAction(this.gameService);

  constructor() {
    const dungeon = this.mazeBuilder.build();
    this.createMaze(dungeon.walls);
    this.createEnemies(dungeon.floors);
    this.createBoss(dungeon.floors);
  }

  onGameStateChange(listener: ObservableListener<GameStateChange>): () => void {
    return this.gameService.onGameStateChange(listener);
  }

  addPlayer(id: string): boolean {
    const player = new Player(id, this.world.findFreePosition());
    if (!this.world.addObject(player)) {
      return false;
    }

    const added = this.addPlayerAction.execute({ id, position: this.world.toWorldPosition(player.position) });
    if (!added) {
      this.world.removeObject(player.id);
    }
    return added;
  }

  movePlayer(input: MovePlayerInput): boolean {
    const moved = this.movePlayerAction.execute(input);
    if (moved) {
      this.enemyTurnAction.execute();
    }
    return moved;
  }

  attackPlayer(id: string): boolean {
    const attacked = this.attackPlayerAction.execute(id);
    if (attacked) {
      this.enemyTurnAction.execute();
    }
    return attacked;
  }

  setPlayerReady(id: string): boolean {
    return this.setPlayerReadyAction.execute(id);
  }

  private createMaze(walls: readonly Position[]): void {
    let index = 0;
    for (const position of walls) {
      const id = `solid-${index}`;
      const object = new GridObject({ id, position, solid: true });
      if (this.world.addObject(object)) {
        this.gameService.addSolid({ id, position: this.world.toWorldPosition(position), frame: 2 });
        index += 1;
      }
    }
  }

  private createEnemies(floors: readonly Position[]): void {
    const positions = floors.filter((position) => position.x !== 0 || position.y !== 0);
    const enemyPositions = this.getRandomPositions(positions, GameServer.moleCount + GameServer.beholderCount);
    for (const [index, position] of enemyPositions.entries()) {
      const enemy = index < GameServer.moleCount
        ? EnemyFactory.createMole(position)
        : EnemyFactory.createBeholder(position);
      if (!this.world.addObject(enemy)) {
        continue;
      }

      if (!this.gameService.addEnemy(enemy.id, enemy.toState(this.world.toWorldPosition(enemy.position)))) {
        this.world.removeObject(enemy.id);
      }
    }
  }

  private createBoss(floors: readonly Position[]): void {
    for (const position of this.getRandomPositions(floors, floors.length)) {
      const boss = EnemyFactory.createBoss(position);
      if (!this.world.addObject(boss)) {
        continue;
      }

      if (!this.gameService.addEnemy(boss.id, boss.toState(this.world.toWorldPosition(boss.position)))) {
        this.world.removeObject(boss.id);
      }
      return;
    }
  }

  private getRandomPositions(positions: readonly Position[], count: number): Position[] {
    const available = [...positions];
    const selected: Position[] = [];
    while (available.length && selected.length < count) {
      const index = Math.floor(Math.random() * available.length);
      selected.push(available.splice(index, 1)[0]!);
    }
    return selected;
  }
}
