import type Position from "../../lib/common/Position";
import type DoorState from "../domain/DoorState";
import { DOOR_GEM_COLORS, type GemColor } from "../domain/GemColor";
import GridObject from "./GridObject";

export default class Door extends GridObject {
  readonly placedGems: GemColor[] = [];
  open = false;

  constructor(id: string, position: Position, width: number, height: number) {
    super({ id, position, solid: true, width, height });
  }

  placeGem(color: GemColor): boolean {
    if (this.open || !DOOR_GEM_COLORS.includes(color) || this.placedGems.includes(color)) {
      return false;
    }

    this.placedGems.push(color);
    if (this.placedGems.length === DOOR_GEM_COLORS.length) {
      this.open = true;
      this.solid = false;
    }
    return true;
  }

  toState(position: Position): DoorState {
    return { id: this.id, position, width: this.width, height: this.height, open: this.open, placedGems: this.placedGems };
  }
}
