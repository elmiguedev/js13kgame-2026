import { DOOR_GEM_COLORS } from "../domain/GemColor";
import Door from "../entities/Door";
import Player from "../entities/Player";
import World from "../entities/World";
import GameService from "../services/GameService";
import type Action from "./Action";
import AttackPlayerAction from "./AttackPlayerAction";

export default class InteractPlayerAction implements Action<string, boolean> {
  constructor(
    private readonly gameService: GameService,
    private readonly world: World,
    private readonly attackPlayerAction: AttackPlayerAction,
  ) { }

  execute(playerId: string): boolean {
    const player = this.gameService.getPlayer(playerId);
    const worldPlayer = this.world.getObject(playerId);
    if (!player || !(worldPlayer instanceof Player)) {
      return false;
    }

    const door = this.world.getAdjacentObjects(playerId).find((object): object is Door => object instanceof Door && !object.open);
    if (!door) {
      return this.attackPlayerAction.execute(playerId);
    }

    const color = DOOR_GEM_COLORS.find((gem) => player.gems.includes(gem) && !door.placedGems.includes(gem));
    if (!color || !door.placeGem(color)) {
      return false;
    }

    return this.gameService.updatePlayer({ ...player, gems: player.gems.filter((gem) => gem !== color) })
      && this.gameService.updateDoor(door.toState(this.world.toWorldPosition(door.position)));
  }
}
