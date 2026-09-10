import type Position from "../../lib/common/Position";
import type { GemColor } from "./GemColor";

export type EnemyType = "beholder" | "boss" | "mole" | "totem";

export default interface EnemyState {
  readonly id: string;
  readonly type: EnemyType;
  readonly position: Readonly<Position>;
  readonly hp: number;
  readonly visionRange: number;
  readonly width: number;
  readonly height: number;
  readonly loot?: GemColor;
}
