import type Position from "../../lib/common/Position";

export type EnemyType = "beholder" | "boss" | "mole";

export default interface EnemyState {
  readonly id: string;
  readonly type: EnemyType;
  readonly position: Readonly<Position>;
  readonly hp: number;
  readonly visionRange: number;
  readonly width: number;
  readonly height: number;
}
