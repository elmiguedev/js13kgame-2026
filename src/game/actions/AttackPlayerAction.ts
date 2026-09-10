import Dice from "../../lib/common/Dice";
import Collectible from "../entities/Collectible";
import Enemy from "../entities/Enemy";
import Player from "../entities/Player";
import World from "../entities/World";
import GameService from "../services/GameService";
import type Action from "./Action";

export default class AttackPlayerAction implements Action<string, boolean> {
  constructor(
    private readonly gameService: GameService,
    private readonly world: World,
  ) { }

  execute(playerId: string): boolean {
    const player = this.world.getObject(playerId);
    if (!(player instanceof Player)) {
      return false;
    }

    const target = this.world.getAdjacentObjects(playerId).find((object) => object instanceof Enemy);
    if (!(target instanceof Enemy)) {
      return false;
    }

    const hp = target.takeDamage(Dice.throw(1, 4));
    if (hp <= 0) {
      const updated = this.gameService.updateEnemy(target.id, target.toState(this.world.toWorldPosition(target.position)));
      const removed = updated && this.world.removeObject(target.id) && this.gameService.removeEnemy(target.id);
      if (removed && target.loot) {
        const gem = new Collectible(`gem-${target.loot}`, target.position, target.loot);
        return this.world.addObject(gem) && this.gameService.addCollectible(gem.toState(this.world.toWorldPosition(gem.position)));
      }
      return removed;
    }

    return this.gameService.updateEnemy(target.id, target.toState(this.world.toWorldPosition(target.position)));
  }
}
