import type Player from "../domain/Player";
import Sprite from "../../lib/entities/Sprite";

export default class PlayerEntity extends Sprite {
  constructor(player: Player) {
    super({
      id: `player-${player.id}`,
      x: player.position.x,
      y: player.position.y,
      width: 12,
      height: 12,
      color: PlayerEntity.getColor(player.id),
    });
  }

  sync(player: Player): void {
    this.position.x = player.position.x;
    this.position.y = player.position.y;
  }

  private static getColor(id: string): string {
    let hash = 0;
    for (let index = 0; index < id.length; index += 1) {
      hash = (hash * 31 + id.charCodeAt(index)) | 0;
    }

    return `#${(hash >>> 0).toString(16).padStart(6, "0").slice(-6)}`;
  }
}
