import type Position from "../../../lib/common/Position";
import Text from "../../../lib/entities/Text";
import type PlayerState from "../../domain/PlayerState";

export default class PlayerListEntity extends Text {
  constructor(position: Position, player: PlayerState) {
    super(position, player.id);
  }

  updatePlayer(player: PlayerState): void {
    this.text = player.id;
  }
}
