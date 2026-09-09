import Dice from "../../lib/common/Dice";
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
      return updated && this.world.removeObject(target.id) && this.gameService.removeEnemy(target.id);
    }

    return this.gameService.updateEnemy(target.id, target.toState(this.world.toWorldPosition(target.position)));
  }
}
