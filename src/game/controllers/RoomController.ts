import SocketController, { type SocketEvent } from "../../lib/controllers/SocketController";
import Observable, { type ObservableListener } from "../../lib/common/Observable";

export type RoomPlayerType = "HOST" | "GUEST";

export interface RoomJoined {
  playerType: RoomPlayerType;
  roomCode: string;
  clientId: string;
  isLocal: boolean;
}

export default class RoomController {
  private readonly socket = new SocketController();
  private readonly playerJoined = new Observable<RoomJoined>();
  private readonly playersReceived = new Observable<readonly string[]>();
  private readonly stateReceived = new Observable<string>();
  private roomCode: string | undefined;
  private playerType: RoomPlayerType | undefined;

  constructor() {
    this.socket.on(this.handleSocketEvent);
  }

  hostRoom(): string {
    const roomCode = SocketController.createRoomCode();
    this.joinRoom(roomCode, "HOST");
    return roomCode;
  }

  joinRoom(roomCode: string, playerType: RoomPlayerType): boolean {
    const normalizedRoomCode = roomCode.trim().toUpperCase();
    if (!normalizedRoomCode) {
      return false;
    }

    const protocol = location.protocol === "https:" ? "wss" : "ws";
    this.roomCode = normalizedRoomCode;
    this.playerType = playerType;
    this.socket.connect(`${protocol}://${location.host}/relay/${encodeURIComponent(normalizedRoomCode)}`);
    return true;
  }

  onPlayerJoined(listener: ObservableListener<RoomJoined>): () => void {
    return this.playerJoined.subscribe(listener);
  }

  onPlayersReceived(listener: ObservableListener<readonly string[]>): () => void {
    return this.playersReceived.subscribe(listener);
  }

  onStateReceived(listener: ObservableListener<string>): () => void {
    return this.stateReceived.subscribe(listener);
  }

  sendPlayers(clientId: string, playerIds: readonly string[]): boolean {
    return this.socket.sendTo(clientId, `players|${playerIds.join(",")}`);
  }

  sendState(state: string): boolean {
    return this.socket.send(`state|${state}`);
  }

  get isHost(): boolean {
    return this.playerType === "HOST";
  }

  destroy(): void {
    this.socket.destroy();
  }

  private readonly handleSocketEvent = (event: SocketEvent): void => {
    if (event.type === "open") {
      console.log(`Connecting to room ${this.roomCode}`);
    } else if (event.type === "id" && this.roomCode && this.playerType) {
      console.log(`Joined room ${this.roomCode} as ${event.clientId}`);
      this.playerJoined.emit({
        playerType: this.playerType,
        roomCode: this.roomCode,
        clientId: event.clientId,
        isLocal: true,
      });
    } else if (event.type === "connect" && this.roomCode) {
      console.log(`Player ${event.clientId} joined room ${this.roomCode}`);
      this.playerJoined.emit({
        playerType: "GUEST",
        roomCode: this.roomCode,
        clientId: event.clientId,
        isLocal: false,
      });
    } else if (event.type === "message") {
      this.handleRoomMessage(event.data);
    } else if (event.type === "error") {
      console.error(`Could not join room ${this.roomCode}`);
    } else if (event.type === "close") {
      console.log(`Left room ${this.roomCode}`);
    }
  };

  private handleRoomMessage(message: string): void {
    const separator = message.indexOf("|");
    const type = separator === -1 ? message : message.slice(0, separator);
    const value = separator === -1 ? "" : message.slice(separator + 1);
    if (type === "players") {
      this.playersReceived.emit(value ? value.split(",") : []);
    } else if (type === "state") {
      this.stateReceived.emit(value);
    }
  }
}
