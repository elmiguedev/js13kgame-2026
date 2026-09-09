import Collectible from "../entities/Collectible";
import Player from "../entities/Player";
import World from "../entities/World";
import GameService from "../services/GameService";
import type Action from "./Action";

export default class CollectGemAction implements Action<string, boolean> {
  constructor(
    private readonly gameService: GameService,
    private readonly world: World,
  ) { }

  execute(playerId: string): boolean {
    const player = this.gameService.getPlayer(playerId);
    const worldPlayer = this.world.getObject(playerId);
    if (!player || !(worldPlayer instanceof Player)) {
      return false;
    }

    const collectible = this.world.getOverlappingObjects(playerId).find((object) => object instanceof Collectible);
    if (!collectible) {
      return false;
    }

    return this.world.removeObject(collectible.id)
      && this.gameService.removeCollectible(collectible.id)
      && this.gameService.updatePlayer({ ...player, gems: [...player.gems, collectible.color] });
  }
}
