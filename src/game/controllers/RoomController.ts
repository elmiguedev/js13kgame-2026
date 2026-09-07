import SocketController, { type SocketEvent } from "../../lib/controllers/SocketController";
import Observable, { type ObservableListener } from "../../lib/common/Observable";
import type { MovePlayerInput } from "../actions/MovePlayerAction";
import type { MoveType } from "../domain/MoveType";

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
  private readonly stateReceived = new Observable<string>();
  private readonly playerReady = new Observable<string>();
  private readonly moveReceived = new Observable<MovePlayerInput>();
  private roomCode: string | undefined;
  private playerType: RoomPlayerType | undefined;
  private clientId: string | undefined;

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
    this.clientId = undefined;
    this.socket.connect(`${protocol}://${location.host}/relay/${encodeURIComponent(normalizedRoomCode)}`);
    return true;
  }

  onPlayerJoined(listener: ObservableListener<RoomJoined>): () => void {
    return this.playerJoined.subscribe(listener);
  }

  onStateReceived(listener: ObservableListener<string>): () => void {
    return this.stateReceived.subscribe(listener);
  }

  onPlayerReady(listener: ObservableListener<string>): () => void {
    return this.playerReady.subscribe(listener);
  }

  onMoveReceived(listener: ObservableListener<MovePlayerInput>): () => void {
    return this.moveReceived.subscribe(listener);
  }

  sendState(state: string): boolean {
    return this.socket.send(`state|${state}`);
  }

  publishState(state: string): boolean {
    this.stateReceived.emit(state);
    return this.sendState(state);
  }

  sendReady(): boolean {
    return this.clientId ? this.socket.send(`ready|${this.clientId}`) : false;
  }

  sendMove(input: MovePlayerInput): boolean {
    return this.socket.send(`move|${input.id}|${input.direction}`);
  }

  get isHost(): boolean {
    return this.playerType === "HOST";
  }

  get localPlayerId(): string | undefined {
    return this.clientId;
  }

  destroy(): void {
    this.socket.destroy();
  }

  private readonly handleSocketEvent = (event: SocketEvent): void => {
    if (event.type === "open") {
      console.log(`Connecting to room ${this.roomCode}`);
    } else if (event.type === "id" && this.roomCode && this.playerType) {
      this.clientId = event.clientId;
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
    if (type === "state") {
      this.stateReceived.emit(value);
    } else if (type === "ready" && value) {
      this.playerReady.emit(value);
    } else if (type === "move") {
      const [id, direction] = value.split("|");
      if (id && this.isMoveType(direction)) {
        this.moveReceived.emit({ id, direction });
      }
    }
  }

  private isMoveType(value: string | undefined): value is MoveType {
    return value === "up" || value === "down" || value === "left" || value === "right";
  }
}
