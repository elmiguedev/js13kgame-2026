import type Position from "../../lib/common/Position";

export default interface PlayerState {
  readonly position: Readonly<Position>;
  readonly hp: number;
  readonly id: string;
}
