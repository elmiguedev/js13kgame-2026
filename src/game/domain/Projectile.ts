import type Position from "../../lib/common/Position";

export default interface Projectile {
  id: string;
  playerId: string;
  position: Position;
}
