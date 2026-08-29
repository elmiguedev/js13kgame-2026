import type Position from "../../lib/common/Position";
import smoothPosition from "../../lib/common/smoothPosition";
import PixelSprite from "../../lib/entities/PixelSprite";
import type Projectile from "../domain/Projectile";

export default class ProjectileEntity extends PixelSprite {
  private readonly targetPosition: Position;

  constructor(projectile: Projectile) {
    super({
      id: `projectile-${projectile.id}`,
      x: projectile.position.x,
      y: projectile.position.y,
      palette: {
        1: "#7DF9FF",
        2: "#FFFFFF",
      },
      pixels: [
        [0, 1, 0],
        [1, 2, 1],
        [0, 1, 0],
      ],
      pixelSize: 2,
    });
    this.targetPosition = { ...projectile.position };
  }

  sync(projectile: Projectile): void {
    this.targetPosition.x = projectile.position.x;
    this.targetPosition.y = projectile.position.y;
  }

  override update(time: number, delta: number): void {
    super.update(time, delta);
    smoothPosition(this.position, this.targetPosition, delta, 24);
  }
}
