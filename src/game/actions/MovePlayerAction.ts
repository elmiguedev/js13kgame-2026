import type { MoveType } from "../domain/MoveType";
import WorldEntity from "../entities/WorldEntity";
import GameService from "../services/GameService";
import type Action from "./Action";

export interface MovePlayerInput {
  id: string;
  direction: MoveType;
}

export default class MovePlayerAction implements Action<MovePlayerInput, boolean> {
  constructor(
    private readonly gameService: GameService,
    private readonly world: WorldEntity,
  ) { }

  execute({ id, direction }: MovePlayerInput): boolean {
    const player = this.gameService.getPlayer(id);
    if (!player) {
      return false;
    }

    const position = this.world.moveObject(id, direction);
    if (!position) {
      return false;
    }

    console.log(`Moving player ${id} in direction ${direction}`);
    return this.gameService.updatePlayer({ ...player, position });
  }
}
