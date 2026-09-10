import type Position from "../../lib/common/Position";
import type EnemyState from "../domain/EnemyState";
import type { EnemyType } from "../domain/EnemyState";
import type { GemColor } from "../domain/GemColor";
import GridObject from "./GridObject";

export default class Enemy extends GridObject {
  hp: number;
  readonly type: EnemyType;
  readonly visionRange: number;

  constructor(id: string, position: Position, type: EnemyType, hp: number, visionRange = 4, width = 1, height = 1, readonly loot?: GemColor) {
    super({ id, position, solid: true, width, height });
    this.hp = hp;
    this.type = type;
    this.visionRange = visionRange;
  }

  takeDamage(damage: number): number {
    this.hp -= damage;
    return this.hp;
  }

  toState(position: Position): EnemyState {
    return { id: this.id, type: this.type, hp: this.hp, visionRange: this.visionRange, width: this.width, height: this.height, loot: this.loot, position };
  }
}
