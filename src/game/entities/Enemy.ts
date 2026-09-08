import type Position from "../../lib/common/Position";
import type EnemyState from "../domain/EnemyState";
import type { EnemyType } from "../domain/EnemyState";
import GridObject from "./GridObject";

export default class Enemy extends GridObject {
  hp: number;
  readonly type: EnemyType;
  readonly visionRange: number;

  constructor(id: string, position: Position, type: EnemyType, hp: number, visionRange = 4) {
    super({ id, position, solid: true });
    if (!Number.isFinite(visionRange) || visionRange < 0) {
      throw new Error("Enemy vision range must be non-negative.");
    }
    this.hp = hp;
    this.type = type;
    this.visionRange = visionRange;
  }

  takeDamage(damage: number): number {
    if (!Number.isFinite(damage) || damage <= 0) {
      throw new Error("Damage must be greater than zero.");
    }
    this.hp -= damage;
    return this.hp;
  }

  toState(position: Position): EnemyState {
    return { id: this.id, type: this.type, hp: this.hp, visionRange: this.visionRange, position };
  }
}
