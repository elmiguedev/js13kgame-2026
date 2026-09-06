import type Position from "../../../lib/common/Position";
import Text from "../../../lib/entities/Text";
import type PlayerState from "../../domain/PlayerState";

export default class PlayerListEntity extends Text {
  constructor(position: Position, players: ReadonlyMap<string, PlayerState>) {
    super(position, PlayerListEntity.toText(players));
  }

  updatePlayers(players: ReadonlyMap<string, PlayerState>): void {
    this.text = PlayerListEntity.toText(players);
  }

  private static toText(players: ReadonlyMap<string, PlayerState>): string {
    return Array.from(players.values(), (player) => player.id).join("\n");
  }
}
