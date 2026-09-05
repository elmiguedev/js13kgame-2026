import { Keys } from "../../lib/controllers/KeyboardController";
import SpriteSheet from "../../lib/entities/SpriteSheet";
import Scene from "../../lib/Scene";
import GameController from "../controllers/GameController";
import type { MoveType } from "../domain/MoveType";

export default class GameScene extends Scene {
  private readonly spriteSheet = new SpriteSheet("./spritesheet.png", 8, 8, 8, 8);
  private readonly gameController = GameController.getInstance();
  private unsubscribeGameState: (() => void) | undefined;

  constructor() {
    super("GameScene");
  }

  override create(): void {
    this.createKeys();
    this.createEvents();
    this.gameController.gameService.setGameStatus("game");
    console.log("Game state:", this.gameController.gameService.state);
  }

  override shutdown(): void {
    this.unsubscribeGameState?.();
    this.unsubscribeGameState = undefined;
  }

  private createEvents(): void {
    this.unsubscribeGameState = this.gameController.onGameStateChange((event) => {
      console.log("Game state changed:", event);
    });
  }

  private createKeys(): void {
    this.input.keyboard.onKeyPress(Keys.ARROW_UP, () => this.movePlayer("up"));
    this.input.keyboard.onKeyPress(Keys.ARROW_DOWN, () => this.movePlayer("down"));
    this.input.keyboard.onKeyPress(Keys.ARROW_LEFT, () => this.movePlayer("left"));
    this.input.keyboard.onKeyPress(Keys.ARROW_RIGHT, () => this.movePlayer("right"));

  }

  private movePlayer(direction: MoveType): void {
    this.gameController.actions.movePlayer.execute({ id: "player1", direction });
  }
}
