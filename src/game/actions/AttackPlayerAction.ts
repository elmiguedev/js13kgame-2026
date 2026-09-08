import Enemy from "../entities/Enemy";
import Player from "../entities/Player";
import World from "../entities/World";
import GameService from "../services/GameService";
import type Action from "./Action";

export default class AttackPlayerAction implements Action<string, boolean> {
  private static readonly damage = 1;

  constructor(
    private readonly gameService: GameService,
    private readonly world: World,
  ) { }

  execute(playerId: string): boolean {
    const player = this.world.getObject(playerId);
    if (!(player instanceof Player)) {
      return false;
    }

    const target = this.world.getAdjacentObject(playerId, player.direction);
    if (!(target instanceof Enemy)) {
      return false;
    }

    const hp = target.takeDamage(AttackPlayerAction.damage);
    if (hp <= 0) {
      return this.world.removeObject(target.id) && this.gameService.removeEnemy(target.id);
    }

    return this.gameService.updateEnemy(target.id, target.toState(this.world.toWorldPosition(target.position)));
  }
}
