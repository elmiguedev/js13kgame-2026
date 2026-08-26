import type Position from "../../lib/common/Position";
import type GameObject from "../../lib/Object";
import type { RoomEvent } from "../controllers/RoomController";
import type GameState from "../domain/GameState";
import EnemyEntity from "../entities/EnemyEntity";
import EnemyTotemEntity from "../entities/EnemyTotemEntity";
import PlayerEntity from "../entities/PlayerEntity";
import RoomScene from "./RoomScene";

export default class GameScene extends RoomScene {
  private readonly players = new Map<string, PlayerEntity>();
  private readonly enemies = new Map<string, EnemyEntity>();
  private readonly totems = new Map<string, EnemyTotemEntity>();
  private unsubscribe: (() => void) | undefined;
  private unsubscribeRoom: (() => void) | undefined;

  constructor() {
    super("GameScene");
  }

  override create(): void {
    this.syncState(this.room.state);
    this.unsubscribe = this.room.onStateChange(this.syncState);
    this.unsubscribeRoom = this.room.on(this.handleRoomEvent);
  }

  override shutdown(): void {
    this.unsubscribe?.();
    this.unsubscribeRoom?.();
  }

  override update(_time: number, delta: number): void {
    this.room.update(delta);
  }

  override handleClick(position: Position, clickedObject: GameObject | undefined): void {
    if (clickedObject instanceof EnemyEntity) {
      this.room.attack(clickedObject.id.slice("enemy-".length));
    } else {
      this.room.moveTo(position.x, position.y);
    }
  }

  private readonly handleRoomEvent = (event: RoomEvent): void => {
    if (event.type === "host-left") {
      this.scene.start("StartScene");
    }
  };

  private readonly syncState = (state: GameState): void => {
    const localPlayerId = this.room.localPlayerId;
    const playerIds = new Set(state.players.map((player) => player.id));
    for (const [id, entity] of this.players) {
      if (!playerIds.has(id)) {
        this.entities.remove(entity.id);
        this.players.delete(id);
      }
    }

    for (const player of state.players) {
      const entity = this.players.get(player.id) ?? this.entities.add(new PlayerEntity(player));
      entity.sync(player, player.id === localPlayerId);
      this.players.set(player.id, entity);
    }

    const localPlayer = localPlayerId ? this.players.get(localPlayerId) : undefined;
    if (localPlayer) {
      this.camera.startFollow(localPlayer);
    } else {
      this.camera.stopFollow();
    }

    const totemIds = new Set(state.totems.map((totem) => totem.id));
    for (const [id, entity] of this.totems) {
      if (!totemIds.has(id)) {
        this.entities.remove(entity.id);
        this.totems.delete(id);
      }
    }

    for (const totem of state.totems) {
      const entity = this.totems.get(totem.id) ?? this.entities.add(new EnemyTotemEntity(totem));
      entity.sync(totem);
      this.totems.set(totem.id, entity);
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
