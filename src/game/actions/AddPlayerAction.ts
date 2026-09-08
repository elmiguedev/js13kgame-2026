import type Position from "../../lib/common/Position";
import Player from "../entities/Player";
import GameService from "../services/GameService";
import type Action from "./Action";

export interface AddPlayerInput {
  id: string;
  position: Position;
}

export default class AddPlayerAction implements Action<AddPlayerInput, boolean> {
  constructor(private readonly gameService: GameService) { }

  execute({ id, position }: AddPlayerInput): boolean {
    if (this.gameService.getPlayer(id)) {
      return false;
    }

    const playerToAdd = { id, hp: Player.maxHp, position, ready: false };
    return this.gameService.addPlayer(playerToAdd);
  }
}
