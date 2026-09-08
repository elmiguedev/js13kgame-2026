import type Position from "../../lib/common/Position";
import type EnemyState from "../domain/EnemyState";
import GridObject from "./GridObject";

export default class Enemy extends GridObject {
  readonly hp: number;

  constructor(id: string, position: Position, hp = 25) {
    super({ id, position, solid: true });
    this.hp = hp;
  }

  toState(position: Position): EnemyState {
    return { id: this.id, hp: this.hp, position };
  }
}
