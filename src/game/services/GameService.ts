import Observable, { type ObservableListener } from "../../lib/common/Observable";
import type CollectibleState from "../domain/CollectibleState";
import type DoorState from "../domain/DoorState";
import type EnemyState from "../domain/EnemyState";
import type GameState from "../domain/GameState";
import type { GameStateType } from "../domain/GameStateType";
import type PlayerState from "../domain/PlayerState";
import type SolidState from "../domain/SolidState";
import type GameStateChange from "../events/GameStateChange";
import type GameStatusChange from "../events/GameStatusChange";

export default class GameService {
  private readonly players = new Map<string, PlayerState>();
  private readonly enemies = new Map<string, EnemyState>();
  private readonly solids = new Map<string, SolidState>();
  private readonly collectibles = new Map<string, CollectibleState>();
  private readonly doors = new Map<string, DoorState>();
  private readonly gameStateChanges = new Observable<GameStateChange>();
  private readonly gameStatusChanges = new Observable<GameStatusChange>();
  readonly state: GameState = {
    status: "lobby",
    players: this.players,
    enemies: this.enemies,
    solids: this.solids,
    collectibles: this.collectibles,
    doors: this.doors,
  };

  onGameStateChange(listener: ObservableListener<GameStateChange>): () => void {
    return this.gameStateChanges.subscribe(listener);
  }

  onGameStatusChange(listener: ObservableListener<GameStatusChange>): () => void {
    return this.gameStatusChanges.subscribe(listener);
  }

  setGameStatus(status: GameStateType): boolean {
    if (this.state.status === status) {
      return false;
    }

    this.state.status = status;
    this.gameStatusChanges.emit({ status });
    this.emitStateChange();
    return true;
  }

  getPlayer(id: string): PlayerState | undefined {
    return this.players.get(id);
  }

  addPlayer(player: PlayerState): boolean {
    if (this.players.has(player.id)) {
      return false;
    }

    this.players.set(player.id, this.copyPlayer(player));
    this.emitStateChange();
    return true;
  }

  setPlayers(players: ReadonlyMap<string, PlayerState>): void {
    this.players.clear();
    for (const [id, player] of players) {
      this.players.set(id, this.copyPlayer(player));
    }
    this.emitStateChange();
  }

  setState(state: GameState): void {
    const statusChanged = this.state.status !== state.status;
    this.state.status = state.status;
    this.players.clear();
    this.enemies.clear();
    this.solids.clear();
    this.collectibles.clear();
    this.doors.clear();
    for (const [id, player] of state.players) {
      this.players.set(id, this.copyPlayer(player));
    }
    for (const [id, enemy] of state.enemies) {
      this.enemies.set(id, this.copyEnemy(enemy));
    }
    for (const [id, solid] of state.solids) {
      this.solids.set(id, this.copySolid(solid));
    }
    for (const [id, collectible] of state.collectibles) {
      this.collectibles.set(id, this.copyCollectible(collectible));
    }
    for (const [id, door] of state.doors) {
      this.doors.set(id, this.copyDoor(door));
    }
    if (statusChanged) {
      this.gameStatusChanges.emit({ status: state.status });
    }
    this.emitStateChange();
  }

  updatePlayer(player: PlayerState): boolean {
    if (!this.players.has(player.id)) {
      return false;
    }

    this.players.set(player.id, this.copyPlayer(player));
    this.emitStateChange();
    return true;
  }

  removePlayer(id: string): boolean {
    if (!this.players.delete(id)) {
      return false;
    }

    this.emitStateChange();
    return true;
  }

  addSolid(solid: SolidState): boolean {
    if (this.solids.has(solid.id)) {
      return false;
    }

    this.solids.set(solid.id, this.copySolid(solid));
    this.emitStateChange();
    return true;
  }

  getEnemy(id: string): EnemyState | undefined {
    return this.enemies.get(id);
  }

  addEnemy(id: string, enemy: EnemyState): boolean {
    if (this.enemies.has(id)) {
      return false;
    }

    this.enemies.set(id, this.copyEnemy(enemy));
    this.emitStateChange();
    return true;
  }

  updateEnemy(id: string, enemy: EnemyState): boolean {
    if (!this.enemies.has(id)) {
      return false;
    }

    this.enemies.set(id, this.copyEnemy(enemy));
    this.emitStateChange();
    return true;
  }

  updateEnemies(enemies: Iterable<EnemyState>): boolean {
    let updated = false;
    for (const enemy of enemies) {
      if (this.enemies.has(enemy.id)) {
        this.enemies.set(enemy.id, this.copyEnemy(enemy));
        updated = true;
      }
    }

    if (updated) {
      this.emitStateChange();
    }
    return updated;
  }

  removeEnemy(id: string): boolean {
    if (!this.enemies.delete(id)) {
      return false;
    }

    this.emitStateChange();
    return true;
  }

  getCollectible(id: string): CollectibleState | undefined {
    return this.collectibles.get(id);
  }

  addCollectible(collectible: CollectibleState): boolean {
    if (this.collectibles.has(collectible.id)) {
      return false;
    }

    this.collectibles.set(collectible.id, this.copyCollectible(collectible));
    this.emitStateChange();
    return true;
  }

  removeCollectible(id: string): boolean {
    if (!this.collectibles.delete(id)) {
      return false;
    }

    this.emitStateChange();
    return true;
  }

  getDoor(id: string): DoorState | undefined {
    return this.doors.get(id);
  }

  addDoor(door: DoorState): boolean {
    if (this.doors.has(door.id)) {
      return false;
    }

    this.doors.set(door.id, this.copyDoor(door));
    this.emitStateChange();
    return true;
  }

  updateDoor(door: DoorState): boolean {
    if (!this.doors.has(door.id)) {
      return false;
    }

    this.doors.set(door.id, this.copyDoor(door));
    this.emitStateChange();
    return true;
  }

  private emitStateChange(): void {
    this.gameStateChanges.emit({
      state: {
        status: this.state.status,
        players: new Map(this.players),
        enemies: new Map(this.enemies),
        solids: new Map(this.solids),
        collectibles: new Map(this.collectibles),
        doors: new Map(this.doors),
      },
    });
  }

  private copyPlayer(player: PlayerState): PlayerState {
    return { ...player, position: { ...player.position }, gems: [...player.gems] };
  }

  private copyEnemy(enemy: EnemyState): EnemyState {
    return { ...enemy, position: { ...enemy.position } };
  }

  private copySolid(solid: SolidState): SolidState {
    return { ...solid, position: { ...solid.position } };
  }

  private copyCollectible(collectible: CollectibleState): CollectibleState {
    return { ...collectible, position: { ...collectible.position } };
  }

  private copyDoor(door: DoorState): DoorState {
    return { ...door, position: { ...door.position }, placedGems: [...door.placedGems] };
  }
}
