import { Keys } from "../../lib/controllers/KeyboardController";
import SpriteSheet from "../../lib/entities/SpriteSheet";
import Scene from "../../lib/Scene";
import GameController from "../controllers/GameController";
import type { MoveType } from "../domain/MoveType";
import type PlayerState from "../domain/PlayerState";
import type SolidState from "../domain/SolidState";
import FogOfWar from "../entities/FogOfWar";
import PlayerEntity from "../entities/PlayerEntity";
import SolidEntity from "../entities/SolidEntity";

export default class GameScene extends Scene {
  private readonly spriteSheet = new SpriteSheet("./spritesheet.png", 8, 8, 8, 8);
  private readonly gameController = GameController.getInstance();
  private readonly fog = new FogOfWar();
  private readonly playerEntities = new Map<string, PlayerEntity>();
  private readonly solidEntities = new Map<string, SolidEntity>();
  private unsubscribeGameState: (() => void) | undefined;

  constructor() {
    super("GameScene");
  }

  override create(): void {
    this.createKeys();
    this.createEvents();
  }

  override shutdown(): void {
    this.unsubscribeGameState?.();
    this.unsubscribeGameState = undefined;
  }

  private createEvents(): void {
    this.unsubscribeGameState = this.gameController.onGameStateChange((event) => {
      console.log("Game state changed:", event);
      this.syncSolidEntities(event.state.solids);
      this.syncPlayerEntities(event.state.players);
      this.updateFog();
    });
  }

  private createKeys(): void {
    this.input.keyboard.onKeyPress(Keys.ARROW_UP, () => this.movePlayer("up"));
    this.input.keyboard.onKeyPress(Keys.ARROW_DOWN, () => this.movePlayer("down"));
    this.input.keyboard.onKeyPress(Keys.ARROW_LEFT, () => this.movePlayer("left"));
    this.input.keyboard.onKeyPress(Keys.ARROW_RIGHT, () => this.movePlayer("right"));

  }

  private syncPlayerEntities(players: ReadonlyMap<string, PlayerState>): void {
    const localPlayerId = this.gameController.localPlayerId;
    for (const [id, player] of players) {
      const entity = this.playerEntities.get(id);
      if (entity) {
        entity.updateState(player);
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

  private updateFog(): void {
    const localPlayerId = this.gameController.localPlayerId;
    const localPlayer = localPlayerId ? this.playerEntities.get(localPlayerId) : undefined;
    this.fog.apply(localPlayer, this.playerEntities.values());
    this.fog.apply(localPlayer, this.solidEntities.values());
  }

  private movePlayer(direction: MoveType): void {
    this.gameController.moveLocalPlayer(direction);
  }
}
