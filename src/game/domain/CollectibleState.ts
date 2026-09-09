import type Position from "../../lib/common/Position";
import type { GemColor } from "./GemColor";

export default interface CollectibleState {
  readonly id: string;
  readonly color: GemColor;
  readonly position: Readonly<Position>;
}
