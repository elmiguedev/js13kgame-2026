import type Position from "../../lib/common/Position";
import type CollectibleState from "../domain/CollectibleState";
import type { GemColor } from "../domain/GemColor";
import GridObject from "./GridObject";

export default class Collectible extends GridObject {
  constructor(id: string, position: Position, readonly color: GemColor) {
    super({ id, position });
  }

  toState(position: Position): CollectibleState {
    return { id: this.id, color: this.color, position };
  }
}
