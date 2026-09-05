import Observable, { type ObservableListener } from "../../lib/common/Observable";
import type EnemyState from "../domain/EnemyState";
import type GameState from "../domain/GameState";
import type { GameStateType } from "../domain/GameStateType";
import type PlayerState from "../domain/PlayerState";
import type GameStateChange from "../events/GameStateChange";
import type GameStatusChange from "../events/GameStatusChange";

export default class GameService {
  private readonly players = new Map<string, PlayerState>();
  private readonly enemies = new Map<string, EnemyState>();
  private readonly gameStateChanges = new Observable<GameStateChange>();
  private readonly gameStatusChanges = new Observable<GameStatusChange>();
  readonly state: GameState = {
    status: "lobby",
    players: this.players,
    enemies: this.enemies,
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

  removeEnemy(id: string): boolean {
    if (!this.enemies.delete(id)) {
      return false;
    }

    this.emitStateChange();
    return true;
  }

  private emitStateChange(): void {
    this.gameStateChanges.emit({
      state: {
        status: this.state.status,
        players: new Map(this.players),
        enemies: new Map(this.enemies),
      },
    });
  }

  private copyPlayer(player: PlayerState): PlayerState {
    return { ...player, position: { ...player.position } };
  }

  private copyEnemy(enemy: EnemyState): EnemyState {
    return { ...enemy, position: { ...enemy.position } };
  }
}
