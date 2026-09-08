import type Position from "../../lib/common/Position";

export interface FogTarget {
  readonly position: Readonly<Position>;
  visible: boolean;
  alpha: number;
}

export interface FogOfWarConfig {
  clearRadius?: number;
  fadeDistance?: number;
  cellSize?: number;
  useLineOfSight?: boolean;
}

export default class FogOfWar {
  private readonly clearRadius: number;
  private readonly fadeRadius: number;
  private readonly cellSize: number;
  private readonly useLineOfSight: boolean;

  constructor({ clearRadius = 3, fadeDistance = 2, cellSize = 8, useLineOfSight = true }: FogOfWarConfig = {}) {
    this.clearRadius = clearRadius * cellSize;
    this.fadeRadius = fadeDistance * cellSize;
    this.cellSize = cellSize;
    this.useLineOfSight = useLineOfSight;
  }

  apply(origin: FogTarget | undefined, targets: Iterable<FogTarget>, blockers: Iterable<FogTarget> = []): void {
    const blockedCells = new Set<string>();
    for (const blocker of blockers) {
      blockedCells.add(this.getCellKey(blocker.position));
    }

    for (const target of targets) {
      target.alpha = origin ? this.getAlpha(origin, target) : 0;
      target.visible = Boolean(origin && target.alpha > 0 && (!this.useLineOfSight || this.hasLineOfSight(origin.position, target.position, blockedCells)));
    }
  }

  private getAlpha(origin: FogTarget, target: FogTarget): number {
    const x = target.position.x - origin.position.x;
    const y = target.position.y - origin.position.y;
    const distance = Math.hypot(x, y);
    if (distance <= this.clearRadius) {
      return 1;
    }
    if (this.fadeRadius === 0 || distance >= this.clearRadius + this.fadeRadius) {
      return 0;
    }
    return 1 - (distance - this.clearRadius) / this.fadeRadius;
  }

  private hasLineOfSight(origin: Readonly<Position>, target: Readonly<Position>, blockedCells: ReadonlySet<string>): boolean {
    let x = Math.round(origin.x / this.cellSize);
    let y = Math.round(origin.y / this.cellSize);
    const targetX = Math.round(target.x / this.cellSize);
    const targetY = Math.round(target.y / this.cellSize);
    const deltaX = Math.abs(targetX - x);
    const deltaY = Math.abs(targetY - y);
    const stepX = x < targetX ? 1 : -1;
    const stepY = y < targetY ? 1 : -1;
    let error = deltaX - deltaY;

    while (x !== targetX || y !== targetY) {
      const doubledError = error * 2;
      if (doubledError > -deltaY) {
        error -= deltaY;
        x += stepX;
      }
      if (doubledError < deltaX) {
        error += deltaX;
        y += stepY;
      }
      if ((x !== targetX || y !== targetY) && blockedCells.has(`${x},${y}`)) {
        return false;
      }
    }
    return true;
  }

  private getCellKey(position: Readonly<Position>): string {
    return `${Math.round(position.x / this.cellSize)},${Math.round(position.y / this.cellSize)}`;
  }
}
