import type Position from "../../lib/common/Position";
import GridObject from "./GridObject";

export default class Player extends GridObject {
  constructor(id: string, position: Position) {
    super({ id, position, solid: true });
  }
}
