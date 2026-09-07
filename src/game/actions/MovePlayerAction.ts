import type { MoveType } from "../domain/MoveType";
import GameService from "../services/GameService";
import type Action from "./Action";

export interface MovePlayerInput {
  id: string;
  direction: MoveType;
}

export default class MovePlayerAction implements Action<MovePlayerInput, boolean> {
  constructor(private readonly gameService: GameService) { }

  execute({ id, direction }: MovePlayerInput): boolean {
    const player = this.gameService.getPlayer(id);
    if (!player) {
      return false;
    }

    console.log(`Moving player ${id} in direction ${direction}`);

    const position = { ...player.position };
    if (direction === "up") position.y -= 8;
    else if (direction === "down") position.y += 8;
    else if (direction === "left") position.x -= 8;
    else position.x += 8;

    return this.gameService.updatePlayer({ ...player, position });
  }
}
