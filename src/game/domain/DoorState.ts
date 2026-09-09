import type Position from "../../lib/common/Position";
import type { GemColor } from "./GemColor";

export default interface DoorState {
  readonly id: string;
  readonly position: Readonly<Position>;
  readonly width: number;
  readonly height: number;
  readonly open: boolean;
  readonly placedGems: readonly GemColor[];
}
