import { Keys, type Key } from "../../lib/controllers/KeyboardController";
import type { RoomEvent } from "../controllers/RoomController";
import type GameState from "../domain/GameState";
import EnemyEntity from "../entities/EnemyEntity";
import PlayerEntity from "../entities/PlayerEntity";
import RoomScene from "./RoomScene";

export default class GameScene extends RoomScene {
  private readonly players = new Map<string, PlayerEntity>();
  private readonly enemies = new Map<string, EnemyEntity>();
  private keys!: {
    up: Key;
    down: Key;
    left: Key;
    right: Key;
  };
  private unsubscribe: (() => void) | undefined;
  private unsubscribeRoom: (() => void) | undefined;

  constructor() {
    super("GameScene");
  }

  override create(): void {
    this.keys = {
      up: this.input.keyboard.addKey(Keys.ARROW_UP),
      down: this.input.keyboard.addKey(Keys.ARROW_DOWN),
      left: this.input.keyboard.addKey(Keys.ARROW_LEFT),
      right: this.input.keyboard.addKey(Keys.ARROW_RIGHT),
    };
    this.syncState(this.room.state);
    this.unsubscribe = this.room.onStateChange(this.syncState);
    this.unsubscribeRoom = this.room.on(this.handleRoomEvent);
  }

  override shutdown(): void {
    this.unsubscribe?.();
    this.unsubscribeRoom?.();
  }

  override update(_time: number, delta: number): void {
    const x = (this.keys.right.isDown ? 1 : 0) - (this.keys.left.isDown ? 1 : 0);
    const y = (this.keys.down.isDown ? 1 : 0) - (this.keys.up.isDown ? 1 : 0);
    if (x || y) {
      this.room.move(x, y);
    }
    this.room.update(delta);
  }

  private readonly handleRoomEvent = (event: RoomEvent): void => {
    if (event.type === "host-left") {
      this.scene.start("StartScene");
    }
  };

  private readonly syncState = (state: GameState): void => {
    const playerIds = new Set(state.players.map((player) => player.id));
    for (const [id, entity] of this.players) {
      if (!playerIds.has(id)) {
        this.entities.remove(entity.id);
        this.players.delete(id);
      }
    }

    for (const player of state.players) {
      const entity = this.players.get(player.id) ?? this.entities.add(new PlayerEntity(player));
      entity.sync(player);
      this.players.set(player.id, entity);
    }

    const enemyIds = new Set(state.enemies.map((enemy) => enemy.id));
    for (const [id, entity] of this.enemies) {
      if (!enemyIds.has(id)) {
        this.entities.remove(entity.id);
        this.enemies.delete(id);
      }
    }

    for (const enemy of state.enemies) {
      const entity = this.enemies.get(enemy.id) ?? this.entities.add(new EnemyEntity(enemy));
      entity.sync(enemy);
      this.enemies.set(enemy.id, entity);
    }
  };
}
