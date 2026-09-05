import SocketController, { type SocketEvent } from "../../lib/controllers/SocketController";
import Button from "../../lib/entities/Button";
import TextField from "../../lib/entities/TextField";
import Scene from "../../lib/Scene";

export default class StartScene extends Scene {
  private socket: SocketController | undefined;
  private roomCode: string | undefined;

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
    this.entities.add(new TextField({ x: 48, y: 80, width: 64, placeholder: "ROOM" }));
    this.entities.add(new Button({ x: 48, y: 100, text: "JOIN" }));
  }

  override shutdown(): void {
    this.socket?.destroy();
  }

  private readonly hostRoom = (): void => {
    this.socket?.destroy();
    this.socket = new SocketController();
    this.roomCode = SocketController.createRoomCode();

    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${location.host}/relay/${this.roomCode}`;

    this.socket.on(this.handleSocketEvent);
    this.socket.connect(url);
  };

  private readonly handleSocketEvent = (event: SocketEvent): void => {
    if (event.type === "open") {
      console.log(`Connecting to room ${this.roomCode}`);
    } else if (event.type === "id") {
      console.log(`Joined room ${this.roomCode} as ${event.clientId}`);
      this.scene.start("LobbyScene", { playerType: "HOST", roomCode: this.roomCode });
    } else if (event.type === "error") {
      console.error(`Could not join room ${this.roomCode}`);
    } else if (event.type === "close") {
      console.log(`Left room ${this.roomCode}`);
    }
  };

}
