import Text from "../../lib/entities/Text";
import Scene from "../../lib/Scene";
import GameController from "../controllers/GameController";
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
  private playerListEntity!: PlayerListEntity;
  private unsubscribePlayerJoinRoom: (() => void) | undefined;
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
    this.createPlayerList();
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

  private createPlayerList(): void {
    this.playerListEntity = this.entities.add(new PlayerListEntity(
      { x: 16, y: 56 },
      this.gameController.gameService.state.players,
    ));
  }

  private createRoomEvents(): void {
    this.unsubscribePlayerJoinRoom = this.gameController.onPlayerJoinRoom(({ playerType, roomCode }) => {
      console.log("Player joined room:", playerType, roomCode);
    });
    this.unsubscribeGameState = this.gameController.onGameStateChange(({ state }) => {
      this.playerListEntity.updatePlayers(state.players);
      console.log("Game state changed:", state);
    });
  }

  override shutdown(): void {
    this.unsubscribePlayerJoinRoom?.();
    this.unsubscribePlayerJoinRoom = undefined;
    this.unsubscribeGameState?.();
    this.unsubscribeGameState = undefined;
  }
}
