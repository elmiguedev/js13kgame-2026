import { Keys } from "../../lib/controllers/KeyboardController";
import SpriteSheet from "../../lib/entities/SpriteSheet";
import Scene from "../../lib/Scene";
import GameController from "../controllers/GameController";
import type { MoveType } from "../domain/MoveType";
import type PlayerState from "../domain/PlayerState";
import PlayerEntity from "../entities/PlayerEntity";

export default class GameScene extends Scene {
  private readonly spriteSheet = new SpriteSheet("./spritesheet.png", 8, 8, 8, 8);
  private readonly gameController = GameController.getInstance();
  private readonly playerEntities = new Map<string, PlayerEntity>();
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
      this.syncPlayerEntities(event.state.players);
    });
  }

  private createKeys(): void {
    this.input.keyboard.onKeyPress(Keys.ARROW_UP, () => this.movePlayer("up"));
    this.input.keyboard.onKeyPress(Keys.ARROW_DOWN, () => this.movePlayer("down"));
    this.input.keyboard.onKeyPress(Keys.ARROW_LEFT, () => this.movePlayer("left"));
    this.input.keyboard.onKeyPress(Keys.ARROW_RIGHT, () => this.movePlayer("right"));

  }

  private syncPlayerEntities(players: ReadonlyMap<string, PlayerState>): void {
    for (const [id, player] of players) {
      const entity = this.playerEntities.get(id);
      if (entity) {
        entity.updateState(player);
      } else {
        const playerEntity = this.entities.add(new PlayerEntity(this.spriteSheet, player));
        this.playerEntities.set(id, playerEntity);
      }
    }

    for (const [id, entity] of this.playerEntities) {
      if (!players.has(id)) {
        this.entities.remove(entity.id);
        this.playerEntities.delete(id);
      }
    }
  }

  private movePlayer(direction: MoveType): void {
    this.gameController.moveLocalPlayer(direction);
  }
}
