import Text from "../../lib/entities/Text";
import Scene from "../../lib/Scene";

interface LobbyData {
  playerType?: "HOST" | "GUEST";
  roomCode?: string;
}

export default class LobbyScene extends Scene {
  private playerTypeText!: Text;
  private playerType = "GUEST";
  private roomCode = "";

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
}
