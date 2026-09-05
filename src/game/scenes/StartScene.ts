import SocketController, { type SocketEvent } from "../../lib/controllers/SocketController";
import Button from "../../lib/entities/Button";
import TextField from "../../lib/entities/TextField";
import Scene from "../../lib/Scene";

export default class StartScene extends Scene {
  private socket: SocketController | undefined;
  private roomCode: string | undefined;
  private roomTextField: TextField | undefined;
  private playerType: "HOST" | "GUEST" | undefined;

  constructor() {
    super("StartScene");
  }

  override create(): void {
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
    this.socket?.destroy();
  }

  private readonly hostRoom = (): void => {
    const roomCode = SocketController.createRoomCode();
    this.createSocketRoom(roomCode, "HOST");
  };

  private readonly joinRoom = (): void => {
    const roomCode = this.roomTextField?.value.trim();

    if (!roomCode) {
      console.error("Room code is empty.");
      return;
    }

    this.createSocketRoom(roomCode, "GUEST");
  };

  private createSocketRoom(roomCode: string, playerType: "HOST" | "GUEST"): void {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${location.host}/relay/${roomCode}`;

    this.socket?.destroy();
    this.socket = new SocketController();
    this.roomCode = roomCode;
    this.playerType = playerType;

    this.socket.on(this.handleSocketEvent);
    this.socket.connect(url);
  }

  private startLobbyScene(): void {
    if (!this.playerType || !this.roomCode) {
      return;
    }

    this.scene.start("LobbyScene", { playerType: this.playerType, roomCode: this.roomCode });
  }

  private readonly handleSocketEvent = (event: SocketEvent): void => {
    if (event.type === "open") {
      console.log(`Connecting to room ${this.roomCode}`);
    } else if (event.type === "id") {
      console.log(`Joined room ${this.roomCode} as ${event.clientId}`);
      this.startLobbyScene();
    } else if (event.type === "error") {
      console.error(`Could not join room ${this.roomCode}`);
    } else if (event.type === "close") {
      console.log(`Left room ${this.roomCode}`);
    }
  };

}
