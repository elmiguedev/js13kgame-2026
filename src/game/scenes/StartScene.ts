import Button from "../../lib/entities/Button";
import TextField from "../../lib/entities/TextField";
import Scene from "../../lib/Scene";
import GameController from "../controllers/GameController";

export default class StartScene extends Scene {
  private readonly gameController = GameController.getInstance();
  private roomTextField: TextField | undefined;
  private unsubscribePlayerJoinRoom: (() => void) | undefined;

  constructor() {
    super("StartScene");
  }

  override create(): void {
    this.unsubscribePlayerJoinRoom = this.gameController.onPlayerJoinRoom(this.startLobbyScene);
    this.createHostButton();
    this.createJoinButton();
  }

  private createHostButton(): void {
    this.entities.add(new Button({ x: 48, y: 48, text: "HOST", onClick: this.hostRoom }));
  }

  private createJoinButton(): void {
    this.roomTextField = this.entities.add(new TextField({ x: 48, y: 80, width: 64, placeholder: "ROOM" }));
    this.entities.add(new Button({ x: 48, y: 100, text: "JOIN", onClick: this.joinRoom }));
  }

  override shutdown(): void {
    this.unsubscribePlayerJoinRoom?.();
    this.unsubscribePlayerJoinRoom = undefined;
  }

  private readonly hostRoom = (): void => {
    this.gameController.hostRoom();
  };

  private readonly joinRoom = (): void => {
    const roomCode = this.roomTextField?.value.trim();

    if (!roomCode) {
      console.error("Room code is empty.");
      return;
    }

    this.gameController.joinRoom(roomCode, "GUEST");
  };

  private readonly startLobbyScene = ({ playerType, roomCode }: { playerType: "HOST" | "GUEST"; roomCode: string }): void => {
    this.scene.start("LobbyScene", { playerType, roomCode });
  };
}
