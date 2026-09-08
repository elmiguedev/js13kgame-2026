import type Position from "../../lib/common/Position";
import type { MoveType } from "../domain/MoveType";
import GridObject from "./GridObject";

export default class Player extends GridObject {
  private facing: MoveType = "down";

  constructor(id: string, position: Position) {
    super({ id, position, solid: true });
  }

  get direction(): MoveType {
    return this.facing;
  }

  setFacing(direction: MoveType): void {
    this.facing = direction;
  }
}
