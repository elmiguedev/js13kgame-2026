import type Position from "../../lib/common/Position";

export default interface EnemyState {
  readonly id: string;
  readonly position: Readonly<Position>;
  readonly hp: number;
  readonly visionRange: number;
}
