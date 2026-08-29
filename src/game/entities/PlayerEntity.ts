import type Player from "../domain/Player";
import type Position from "../../lib/common/Position";
import smoothPosition from "../../lib/common/smoothPosition";
import PixelSprite from "../../lib/entities/PixelSprite";

export default class PlayerEntity extends PixelSprite {
  private idleDelay = 0;
  private attackDelay = 0;
  private attackSequence: number;
  private readonly targetPosition: Position;

  constructor(player: Player) {
    super({
      id: `player-${player.id}`,
      x: player.position.x,
      y: player.position.y,
      palette: {
        1: PlayerEntity.getColor(player.id),
        2: "#FFFFFF",
        3: "#7DF9FF",
        4: "#B56BFF",
      },
      pixels: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 1, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 0, 0, 1, 0, 0],
        [0, 1, 0, 0, 0, 1, 0, 0]
      ],
      pixelSize: 2,
      animations: {
        idle: {
          frames: [
            [

              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 1, 0, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0]
            ],
            [
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 1, 0, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
            ],
          ],
          frameDuration: 300,
          loop: true,
        },
        walk: {
          frames: [
            [
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 1, 0, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0]
            ],
            [
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
              [1, 0, 0, 0, 0, 0, 1, 0],
            ],
          ],
          frameDuration: 120,
          loop: true,
        },
        attack: {
          frames: [
            [
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 1, 0, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 2, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
            ],
            [
              [0, 0, 0, 0, 0, 0, 0, 2],
              [0, 0, 0, 0, 0, 0, 2, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 1, 0, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 2, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
            ],
            [
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 1, 0, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 2, 0],
              [0, 1, 0, 0, 0, 1, 0, 2],
              [0, 1, 0, 0, 0, 1, 0, 0],
            ],
          ],
          frameDuration: 80,
        },
        cast: {
          frames: [
            [
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 1, 0, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 3, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
            ],
            [
              [0, 0, 0, 0, 0, 0, 4, 0],
              [0, 0, 0, 0, 0, 3, 0, 0],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 1, 0, 1, 3, 0],
              [0, 1, 1, 1, 1, 1, 4, 3],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
            ],
            [
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 3],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 1, 0, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 3, 4],
              [0, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
              [0, 1, 0, 0, 0, 1, 0, 0],
            ],
          ],
          frameDuration: 80,
        },
      },
    });
    this.targetPosition = { ...player.position };
    this.attackSequence = player.attackSequence;
    this.anims.play("idle");
  }

  sync(player: Player, immediate = false): void {
    const isAttacking = this.attackSequence !== player.attackSequence;
    if (isAttacking) {
      this.attackSequence = player.attackSequence;
      this.attackDelay = 240;
      this.anims.play(player.attackType === "magic" ? "cast" : "attack");
    } else if (this.targetPosition.x !== player.position.x || this.targetPosition.y !== player.position.y) {
      this.idleDelay = 120;
      if (this.attackDelay <= 0) {
        this.anims.play("walk");
      }
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
    if (this.attackDelay > 0) {
      this.attackDelay -= delta;
      if (this.attackDelay <= 0) {
        this.anims.play(this.idleDelay > 0 ? "walk" : "idle");
      }
      return;
    }
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
