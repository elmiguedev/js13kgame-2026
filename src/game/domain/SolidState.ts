import type Position from "../../lib/common/Position";

export default interface SolidState {
  readonly id: string;
  readonly position: Readonly<Position>;
  readonly frame: number;
}
