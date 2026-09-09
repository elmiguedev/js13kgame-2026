import type Position from "../../lib/common/Position";
import type { GemColor } from "./GemColor";

export default interface PlayerState {
  readonly position: Readonly<Position>;
  readonly hp: number;
  readonly id: string;
  readonly ready: boolean;
  readonly gems: readonly GemColor[];
}
