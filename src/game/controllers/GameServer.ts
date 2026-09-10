import type Position from "../../lib/common/Position";
import AddPlayerAction from "../actions/AddPlayerAction";
import AttackPlayerAction from "../actions/AttackPlayerAction";
import CollectGemAction from "../actions/CollectGemAction";
import EnemyTurnAction from "../actions/EnemyTurnAction";
import InteractPlayerAction from "../actions/InteractPlayerAction";
import MovePlayerAction, { type MovePlayerInput } from "../actions/MovePlayerAction";
import SetPlayerReadyAction from "../actions/SetPlayerReadyAction";
import type { GemColor } from "../domain/GemColor";
import EnemyFactory from "../entities/EnemyFactory";
import Door from "../entities/Door";
import GridObject from "../entities/GridObject";
import MazeBuilder from "../entities/MazeBuilder";
import Player from "../entities/Player";
import World from "../entities/World";
import type GameStateChange from "../events/GameStateChange";
import GameService from "../services/GameService";
import type { ObservableListener } from "../../lib/common/Observable";

export default class GameServer {
  private readonly gameService = new GameService();
  private readonly world = new World();
  private readonly mazeBuilder = new MazeBuilder();
  private readonly addPlayerAction = new AddPlayerAction(this.gameService);
  private readonly attackPlayerAction = new AttackPlayerAction(this.gameService, this.world);
  private readonly collectGemAction = new CollectGemAction(this.gameService, this.world);
  private readonly enemyTurnAction = new EnemyTurnAction(this.gameService, this.world);
  private readonly movePlayerAction = new MovePlayerAction(this.gameService, this.world);
  private readonly interactPlayerAction = new InteractPlayerAction(this.gameService, this.world, this.attackPlayerAction);
  private readonly setPlayerReadyAction = new SetPlayerReadyAction(this.gameService);

  private playerSpawnFloors: readonly Position[] = [];

  constructor() {
    const dungeon = this.mazeBuilder.build();
    this.gameService.setTerrainSeed(Math.floor(Math.random() * 0x100000000));
    this.playerSpawnFloors = dungeon.playerSpawnFloors;
    this.createMaze(dungeon.walls);
    this.createDoor(dungeon.door);
    this.createTotems(dungeon.totemSpawns);
    this.createEnemies(dungeon.enemyPositions);
    this.createBoss(dungeon.bossPosition);
  }

  onGameStateChange(listener: ObservableListener<GameStateChange>): () => void {
    return this.gameService.onGameStateChange(listener);
  }

  addPlayer(id: string): boolean {
    const player = new Player(id, this.world.findFreePosition(undefined, this.playerSpawnFloors));
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
      this.collectGemAction.execute(input.id);
      this.enemyTurnAction.execute();
    }
    return moved;
  }

  interactPlayer(id: string): boolean {
    const interacted = this.interactPlayerAction.execute(id);
    if (interacted) {
      this.enemyTurnAction.execute();
    }
    return interacted;
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

  private createEnemies(positions: readonly Position[]): void {
    for (const [index, position] of positions.entries()) {
      const enemy = index % 2 === 0 ? EnemyFactory.createMole(position) : EnemyFactory.createBeholder(position);
      if (!this.world.addObject(enemy)) {
        continue;
      }

      if (!this.gameService.addEnemy(enemy.id, enemy.toState(this.world.toWorldPosition(enemy.position)))) {
        this.world.removeObject(enemy.id);
      }
    }
  }

  private createBoss(position: Position): void {
    const boss = EnemyFactory.createBoss(position);
    if (this.world.addObject(boss) && !this.gameService.addEnemy(boss.id, boss.toState(this.world.toWorldPosition(boss.position)))) {
      this.world.removeObject(boss.id);
    }
  }

  private createDoor({ position, width, height }: { position: Position; width: number; height: number }): void {
    const door = new Door("boss-door", position, width, height);
    if (this.world.addObject(door)) {
      this.gameService.addDoor(door.toState(this.world.toWorldPosition(door.position)));
    }
  }

  private createTotems(spawns: readonly { color: GemColor; position: Position }[]): void {
    for (const { color, position } of spawns) {
      const totem = EnemyFactory.createTotem(position, color);
      if (this.world.addObject(totem) && !this.gameService.addEnemy(totem.id, totem.toState(this.world.toWorldPosition(totem.position)))) {
        this.world.removeObject(totem.id);
      }
    }
  }

}
