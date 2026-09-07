import GameService from "../services/GameService";
import type Action from "./Action";

export default class AddPlayerAction implements Action<string, boolean> {
  constructor(private readonly gameService: GameService) { }

  execute(id: string): boolean {
    if (this.gameService.getPlayer(id)) {
      return false;
    }

    const playerToAdd = { id, hp: 100, position: { x: 0, y: 0 }, ready: false };
    console.log(`Adding player ${id} with initial state:`, playerToAdd);
    return this.gameService.addPlayer(playerToAdd);
  }
}
