import type { RoomEvent } from "../controllers/RoomController";
import Button from "../../lib/entities/Button";
import Text from "../../lib/entities/Text";
import TextField from "../../lib/entities/TextField";
import RoomScene from "./RoomScene";

export default class StartScene extends RoomScene {
  private roomCode!: TextField;
  private status!: Text;
  private unsubscribe: (() => void) | undefined;

  constructor() {
    super("StartScene");
  }

  override create(): void {
    this.room;
    this.entities.add(new Text({ x: 34, y: 12 }, "RAINBOW RAID"));
    this.entities.add(new Button({
      x: 32,
      y: 32,
      text: "CREATE",
      onClick: () => this.room.create(),
    }));
    this.entities.add(new Text({ x: 32, y: 56 }, "ROOM CODE"));
    this.roomCode = this.entities.add(new TextField({
      x: 20,
      y: 66,
      width: 88,
      maxLength: 6,
      placeholder: "ABC123",
      value: new URL(location.href).searchParams.get("room")?.toUpperCase() ?? "",
      onSubmit: () => this.joinRoom(),
    }));
    this.entities.add(new Button({
      x: 32,
      y: 88,
      text: "JOIN",
      onClick: () => this.joinRoom(),
    }));
    this.status = this.entities.add(new Text({ x: 20, y: 110 }, ""));
    this.unsubscribe = this.room.on(this.handleRoomEvent);
  }

  override shutdown(): void {
    this.unsubscribe?.();
  }

  private joinRoom(): void {
    if (!this.roomCode.value) {
      this.status.text = "ENTER A ROOM CODE";
      return;
    }

    this.room.join(this.roomCode.value);
  }

  private readonly handleRoomEvent = (event: RoomEvent): void => {
    if (event.type === "ready") {
      this.scene.start("LobbyScene");
    } else if (event.type === "rejected") {
      this.status.text = event.reason === "full" ? "ROOM IS FULL" : "GAME STARTED";
    } else if (event.type === "error") {
      this.status.text = "INVALID ROOM CODE";
    }
  }
}
