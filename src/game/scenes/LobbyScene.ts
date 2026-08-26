import type { RoomEvent } from "../controllers/RoomController";
import Button from "../../lib/entities/Button";
import Text from "../../lib/entities/Text";
import RoomScene from "./RoomScene";

export default class LobbyScene extends RoomScene {
  private playersText!: Text;
  private playerListText!: Text;
  private statusText!: Text;
  private unsubscribe: (() => void) | undefined;

  constructor() {
    super("LobbyScene");
  }

  override create(): void {
    this.entities.add(new Text({ x: 44, y: 10 }, "LOBBY"));
    this.entities.add(new Text({ x: 18, y: 28 }, `ROOM: ${this.room.code ?? ""}`));
    this.playersText = this.entities.add(new Text({ x: 18, y: 46 }, ""));
    this.playerListText = this.entities.add(new Text({ x: 18, y: 56 }, ""));
    this.statusText = this.entities.add(new Text({ x: 18, y: 90 }, ""));
    this.entities.add(new Button({
      x: 32,
      y: 106,
      text: "START",
      onClick: () => this.room.start(),
    }));
    this.unsubscribe = this.room.on(this.handleRoomEvent);
    this.refreshPlayers();
  }

  override shutdown(): void {
    this.unsubscribe?.();
  }

  private readonly handleRoomEvent = (event: RoomEvent): void => {
    if (event.type === "players") {
      this.refreshPlayers();
    } else if (event.type === "started") {
      this.scene.start("GameScene");
    } else if (event.type === "host-left") {
      this.scene.start("StartScene");
    }
  };

  private refreshPlayers(): void {
    const players = this.room.players;
    this.playersText.text = `PLAYERS ${players.length}/4`;
    this.playerListText.text = players
      .map((player, index) => `${index + 1}. ${player.id.slice(0, 6)}`)
      .join("\n");
    this.statusText.text = this.room.isHost ? "YOU ARE HOST" : "WAITING FOR HOST";
  }
}
