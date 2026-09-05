import type Position from "../../lib/common/Position";

export default interface EnemyState {
  readonly position: Readonly<Position>;
  readonly hp: number;
}
