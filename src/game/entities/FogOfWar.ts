import type Position from "../../lib/common/Position";

export interface FogTarget {
  readonly position: Readonly<Position>;
  visible: boolean;
}

export default class FogOfWar {
  private readonly radius: number;

  constructor(radiusInCells = 3, cellSize = 8) {
    if (!Number.isInteger(radiusInCells) || radiusInCells < 0 || !Number.isInteger(cellSize) || cellSize <= 0) {
      throw new Error("Fog radius and cell size must be positive integers.");
    }
    this.radius = radiusInCells * cellSize;
  }

  apply(origin: FogTarget | undefined, targets: Iterable<FogTarget>): void {
    for (const target of targets) {
      target.visible = Boolean(origin && this.isVisible(origin, target));
    }
  }

  private isVisible(origin: FogTarget, target: FogTarget): boolean {
    const x = target.position.x - origin.position.x;
    const y = target.position.y - origin.position.y;
    return x * x + y * y <= this.radius * this.radius;
  }
}
