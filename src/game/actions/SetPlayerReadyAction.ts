import GameService from "../services/GameService";
import type Action from "./Action";

export default class SetPlayerReadyAction implements Action<string, boolean> {
  constructor(private readonly gameService: GameService) { }

  execute(id: string): boolean {
    const player = this.gameService.getPlayer(id);
    if (!player || player.ready) {
      return false;
    }

    return this.gameService.updatePlayer({ ...player, ready: true });
  }
}
