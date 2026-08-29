import type Position from "../../lib/common/Position";

export type AttackType = "magic" | "normal";

export default interface Player {
  id: string;
  hp: number;
  attackSequence: number;
  attackType: AttackType;
  position: Position;
}
