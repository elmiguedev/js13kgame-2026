import Button from "../../lib/entities/Button";
import Text from "../../lib/entities/Text";
import Scene from "../../lib/Scene";
import GameController from "../controllers/GameController";
import type PlayerState from "../domain/PlayerState";
import PlayerListEntity from "../entities/lobby/PlayerListEntity";

interface LobbyData {
  playerType?: "HOST" | "GUEST";
  roomCode?: string;
}

export default class LobbyScene extends Scene {
  private playerTypeText!: Text;
  private playerType = "GUEST";
  private roomCode = "";
  private gameController = GameController.getInstance();
  private readonly playerListEntities = new Map<string, PlayerListEntity>();
  private unsubscribeGameState: (() => void) | undefined;

  constructor() {
    super("LobbyScene");
  }

  override init(data?: LobbyData): void {
    this.playerType = data?.playerType ?? "GUEST";
    this.roomCode = data?.roomCode ?? "";
  }

  override create(): void {
    this.createPlayerTypeText();
    this.createRoomCodeText();
    this.createStartButton();
    this.createRoomEvents();
  }

  private createPlayerTypeText(): void {
    this.playerTypeText = this.entities.add(new Text(
      { x: (160 - this.playerType.length * 8) / 2, y: 24 },
      this.playerType,
    ));
  }

  private createRoomCodeText(): void {
    this.entities.add(new Text(
      { x: (160 - this.roomCode.length * 8) / 2, y: 36 },
      this.roomCode,
    ));
  }

  private createStartButton(): void {
    this.entities.add(new Button({ x: 48, y: 136, text: "START", onClick: this.setLocalPlayerReady }));
  }

  private readonly setLocalPlayerReady = (): void => {
    this.gameController.setLocalPlayerReady();
  };

  private createRoomEvents(): void {
    this.unsubscribeGameState = this.gameController.onGameStateChange(({ state }) => {
      this.syncPlayerList(state.players);
      if (state.players.size > 0 && Array.from(state.players.values()).every((player) => player.ready)) {
        this.scene.start("GameScene");
      }
    });
  }

  private syncPlayerList(players: ReadonlyMap<string, PlayerState>): void {
    let row = 0;
    for (const [id, player] of players) {
      const entity = this.playerListEntities.get(id);
      if (entity) {
        entity.updatePlayer(player);
        entity.position.y = 56 + row * 8;
      } else {
        const playerEntity = this.entities.add(new PlayerListEntity({ x: 16, y: 56 + row * 8 }, player));
        this.playerListEntities.set(id, playerEntity);
      }
      row += 1;
    }

    for (const [id, entity] of this.playerListEntities) {
      if (!players.has(id)) {
        this.entities.remove(entity.id);
        this.playerListEntities.delete(id);
      }
    }
  }

  override shutdown(): void {
    this.unsubscribeGameState?.();
    this.unsubscribeGameState = undefined;
  }
}
