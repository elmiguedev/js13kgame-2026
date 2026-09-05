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
    this.createPlayerEntities();
  }

  override shutdown(): void {
    this.unsubscribeGameState?.();
    this.unsubscribeGameState = undefined;
  }

  private createEvents(): void {
    this.unsubscribeGameState = this.gameController.onGameStateChange((event) => {
      console.log("Game state changed:", event);
      this.updatePlayerEntities(event.state.players);
    });
  }

  private createKeys(): void {
    this.input.keyboard.onKeyPress(Keys.ARROW_UP, () => this.movePlayer("up"));
    this.input.keyboard.onKeyPress(Keys.ARROW_DOWN, () => this.movePlayer("down"));
    this.input.keyboard.onKeyPress(Keys.ARROW_LEFT, () => this.movePlayer("left"));
    this.input.keyboard.onKeyPress(Keys.ARROW_RIGHT, () => this.movePlayer("right"));

  }

  private createPlayerEntities(): void {
    for (const player of this.gameController.gameService.state.players.values()) {
      const entity = this.entities.add(new PlayerEntity(this.spriteSheet, player));
      this.playerEntities.set(player.id, entity);
    }
  }

  private updatePlayerEntities(players: ReadonlyMap<string, PlayerState>): void {
    for (const [id, entity] of this.playerEntities) {
      const player = players.get(id);
      if (player) {
        entity.updateState(player);
      }
    }
  }

  private movePlayer(direction: MoveType): void {
    this.gameController.actions.movePlayer.execute({ id: "player1", direction });
  }
}
