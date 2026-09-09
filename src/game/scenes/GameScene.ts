import { Keys } from "../../lib/controllers/KeyboardController";
import FloatingText from "../../lib/entities/FloatingText";
import SpriteSheet from "../../lib/entities/SpriteSheet";
import Scene from "../../lib/Scene";
import GameController from "../controllers/GameController";
import type CollectibleState from "../domain/CollectibleState";
import type DoorState from "../domain/DoorState";
import type EnemyState from "../domain/EnemyState";
import type { MoveType } from "../domain/MoveType";
import type PlayerState from "../domain/PlayerState";
import type SolidState from "../domain/SolidState";
import EnemyFactory from "../entities/EnemyFactory";
import CollectibleEntity from "../entities/CollectibleEntity";
import DoorEntity from "../entities/DoorEntity";
import FogOfWar from "../entities/FogOfWar";
import EnemyEntity from "../entities/EnemyEntity";
import PlayerEntity from "../entities/PlayerEntity";
import SolidEntity from "../entities/SolidEntity";

export default class GameScene extends Scene {
  private readonly spriteSheet = new SpriteSheet("./spritesheet.png", 8, 8, 8, 8);
  private readonly gameController = GameController.getInstance();
  private readonly fog = new FogOfWar({ clearRadius: 3, fadeDistance: 2, useLineOfSight: false });
  private readonly playerEntities = new Map<string, PlayerEntity>();
  private readonly enemyEntities = new Map<string, EnemyEntity>();
  private readonly solidEntities = new Map<string, SolidEntity>();
  private readonly collectibleEntities = new Map<string, CollectibleEntity>();
  private readonly doorEntities = new Map<string, DoorEntity>();
  private unsubscribeGameState: (() => void) | undefined;

  constructor() {
    super("GameScene");
  }

  override create(): void {
    this.camera.setZoom(2);
    this.game.sound.startDungeonLoop();
    this.createKeys();
    this.createEvents();
  }

  override shutdown(): void {
    this.game.sound.stopDungeonLoop();
    this.unsubscribeGameState?.();
    this.unsubscribeGameState = undefined;
  }

  private createEvents(): void {
    this.unsubscribeGameState = this.gameController.onGameStateChange((event) => {
      this.syncSolidEntities(event.state.solids);
      this.syncPlayerEntities(event.state.players);
      this.syncEnemyEntities(event.state.enemies);
      this.syncCollectibleEntities(event.state.collectibles);
      this.syncDoorEntities(event.state.doors);
      this.updateFog();
    });
  }

  private createKeys(): void {
    this.input.keyboard.onKeyPress(Keys.ARROW_UP, () => this.movePlayer("up"));
    this.input.keyboard.onKeyPress(Keys.ARROW_DOWN, () => this.movePlayer("down"));
    this.input.keyboard.onKeyPress(Keys.ARROW_LEFT, () => this.movePlayer("left"));
    this.input.keyboard.onKeyPress(Keys.ARROW_RIGHT, () => this.movePlayer("right"));
    this.input.keyboard.onKeyPress(Keys.SPACE, this.interactPlayer);

  }

  private syncPlayerEntities(players: ReadonlyMap<string, PlayerState>): void {
    const localPlayerId = this.gameController.localPlayerId;
    for (const [id, player] of players) {
      const entity = this.playerEntities.get(id);
      if (entity) {
        const moved = entity.position.x !== player.position.x || entity.position.y !== player.position.y;
        const previousHp = entity.hp;
        this.showDamage(entity, entity.updateState(player), false, player.hp <= 0);
        if (moved && id === localPlayerId && player.hp <= previousHp) {
          this.game.sound.move();
        }
        if (id === localPlayerId) {
          this.camera.startFollow(entity);
        }
      } else {
        const playerEntity = this.entities.add(new PlayerEntity(this.spriteSheet, player));
        this.playerEntities.set(id, playerEntity);
        if (id === localPlayerId) {
          this.camera.startFollow(playerEntity);
        }
      }
    }

    for (const [id, entity] of this.playerEntities) {
      if (!players.has(id)) {
        this.entities.remove(entity.id);
        this.playerEntities.delete(id);
        if (id === localPlayerId) {
          this.camera.stopFollow();
        }
      }
    }
  }

  private syncSolidEntities(solids: ReadonlyMap<string, SolidState>): void {
    for (const [id, solid] of solids) {
      const entity = this.solidEntities.get(id);
      if (entity) {
        entity.updateState(solid);
      } else {
        const solidEntity = this.entities.add(new SolidEntity(this.spriteSheet, solid));
        this.solidEntities.set(id, solidEntity);
      }
    }

    for (const [id, entity] of this.solidEntities) {
      if (!solids.has(id)) {
        this.entities.remove(entity.id);
        this.solidEntities.delete(id);
      }
    }
  }

  private syncCollectibleEntities(collectibles: ReadonlyMap<string, CollectibleState>): void {
    for (const [id, collectible] of collectibles) {
      const entity = this.collectibleEntities.get(id);
      if (entity) {
        entity.updateState(collectible);
      } else {
        this.collectibleEntities.set(id, this.entities.add(new CollectibleEntity(this.spriteSheet, collectible)));
      }
    }

    for (const [id, entity] of this.collectibleEntities) {
      if (!collectibles.has(id)) {
        this.entities.remove(entity.id);
        this.collectibleEntities.delete(id);
      }
    }
  }

  private syncDoorEntities(doors: ReadonlyMap<string, DoorState>): void {
    for (const [id, door] of doors) {
      const entity = this.doorEntities.get(id);
      if (entity) {
        entity.updateState(door);
      } else {
        this.doorEntities.set(id, this.entities.add(new DoorEntity(this.spriteSheet, door)));
      }
    }
  }

  private syncEnemyEntities(enemies: ReadonlyMap<string, EnemyState>): void {
    for (const [id, enemy] of enemies) {
      const entity = this.enemyEntities.get(id);
      if (entity) {
        this.showDamage(entity, entity.updateState(enemy), true, enemy.hp <= 0);
      } else {
        const enemyEntity = this.entities.add(new EnemyEntity(this.spriteSheet, enemy, EnemyFactory.getAnimation(enemy.type)));
        this.enemyEntities.set(id, enemyEntity);
      }
    }

    for (const [id, entity] of this.enemyEntities) {
      if (!enemies.has(id)) {
        this.entities.remove(entity.id);
        this.enemyEntities.delete(id);
      }
    }
  }

  private updateFog(): void {
    const localPlayerId = this.gameController.localPlayerId;
    const localPlayer = localPlayerId ? this.playerEntities.get(localPlayerId) : undefined;
    this.fog.apply(localPlayer, this.playerEntities.values(), this.solidEntities.values());
    this.fog.apply(localPlayer, this.enemyEntities.values(), this.solidEntities.values());
    this.fog.apply(localPlayer, this.solidEntities.values(), this.solidEntities.values());
  }

  private showDamage(entity: PlayerEntity | EnemyEntity, damage: number, isEnemy: boolean, dead: boolean): void {
    if (!damage) {
      return;
    }

    if (isEnemy) {
      this.game.sound.hit();
    } else {
      this.game.sound.damage();
    }
    if (dead) {
      this.game.sound.death();
    }
    this.entities.add(new FloatingText(
      { x: entity.position.x + entity.width / 2 - 3, y: entity.position.y - 3 },
      `-${damage}`,
      { color: "#ff4040", fontSize: 6, duration: 500, rise: 4, onComplete: (text) => this.entities.remove(text.id) },
    ));
  }

  private movePlayer(direction: MoveType): void {
    this.gameController.moveLocalPlayer(direction);
  }

  private readonly interactPlayer = (): void => {
    this.gameController.interactLocalPlayer();
  };
}
