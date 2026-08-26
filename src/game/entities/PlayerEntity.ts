import type Player from "../domain/Player";
import type Position from "../../lib/common/Position";
import smoothPosition from "../../lib/common/smoothPosition";
import PixelSprite from "../../lib/entities/PixelSprite";

export default class PlayerEntity extends PixelSprite {
  private idleDelay = 0;
  private readonly targetPosition: Position;

  constructor(player: Player) {
    super({
      id: `player-${player.id}`,
      x: player.position.x,
      y: player.position.y,
      palette: {
        1: PlayerEntity.getColor(player.id)
      },
      pixels: [
        [1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1]
      ],
      pixelSize: 2,
      animations: {
        idle: {
          frames: [
            [
              [0, 0, 0, 0, 0],
              [1, 1, 1, 1, 1],
              [1, 0, 1, 0, 1],
              [1, 1, 1, 1, 1],
              [1, 1, 1, 1, 1],
              [1, 0, 0, 0, 1],
            ],
            [
              [1, 1, 1, 1, 1],
              [1, 0, 1, 0, 1],
              [1, 1, 1, 1, 1],
              [1, 1, 1, 1, 1],
              [1, 0, 0, 0, 1],
              [1, 0, 0, 0, 1],
            ],
          ],
          frameDuration: 300,
          loop: true,
        },
        walk: {
          frames: [
            [
              [1, 1, 1, 1, 1],
              [1, 0, 1, 0, 1],
              [1, 1, 1, 1, 1],
              [1, 1, 1, 1, 1],
              [1, 0, 0, 0, 1],
              [0, 1, 0, 1, 0],
            ],
            [
              [1, 1, 1, 1, 1],
              [1, 0, 1, 0, 1],
              [1, 1, 1, 1, 1],
              [1, 1, 1, 1, 1],
              [1, 0, 0, 0, 1],
              [1, 0, 1, 0, 1],
            ],
          ],
          frameDuration: 120,
          loop: true,
        },
      },
    });
    this.targetPosition = { ...player.position };
    this.anims.play("idle");
  }

  sync(player: Player, immediate = false): void {
    if (this.targetPosition.x !== player.position.x || this.targetPosition.y !== player.position.y) {
      this.idleDelay = 120;
      this.anims.play("walk");
    }
    this.targetPosition.x = player.position.x;
    this.targetPosition.y = player.position.y;
    if (immediate) {
      this.position.x = player.position.x;
      this.position.y = player.position.y;
    }
  }

  override update(time: number, delta: number): void {
    super.update(time, delta);
    smoothPosition(this.position, this.targetPosition, delta, 14);
    if (this.idleDelay > 0) {
      this.idleDelay -= delta;
      if (this.idleDelay <= 0) {
        this.anims.play("idle");
      }
    }
  }

  private static getColor(id: string): string {
    let hash = 0;
    for (let index = 0; index < id.length; index += 1) {
      hash = (hash * 31 + id.charCodeAt(index)) | 0;
    }

    return `#${(hash >>> 0).toString(16).padStart(6, "0").slice(-6)}`;
  }
}
