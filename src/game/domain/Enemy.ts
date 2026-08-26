import type Position from "../../lib/common/Position";

export default interface Enemy {
  id: string;
  totemId: string;
  hp: number;
  position: Position;
}
