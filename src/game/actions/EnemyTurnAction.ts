import type { MoveType } from "../domain/MoveType";
import Enemy from "../entities/Enemy";
import Player from "../entities/Player";
import World from "../entities/World";
import GameService from "../services/GameService";
import type Action from "./Action";

export default class EnemyTurnAction implements Action<void, boolean> {
  private static readonly followChance = 0.8;

  constructor(
    private readonly gameService: GameService,
    private readonly world: World,
  ) { }

  execute(): boolean {
    const updates = [];
    for (const enemyId of this.gameService.state.enemies.keys()) {
      const enemy = this.world.getObject(enemyId);
      if (!(enemy instanceof Enemy)) {
        continue;
      }

      const player = this.getVisiblePlayer(enemy);
      if (!player) {
        continue;
      }
      if (Math.random() > EnemyTurnAction.followChance) {
        continue;
      }

      const position = this.moveTowardsPlayer(enemy, player);
      if (position) {
        updates.push(enemy.toState(position));
      }
    }
    return this.gameService.updateEnemies(updates);
  }

  private getVisiblePlayer(enemy: Enemy): Player | undefined {
    let closest: Player | undefined;
    let closestDistance = Infinity;
    for (const playerId of this.gameService.state.players.keys()) {
      const player = this.world.getObject(playerId);
      if (!(player instanceof Player)) {
        continue;
      }

      const distance = Math.hypot(player.position.x - enemy.position.x, player.position.y - enemy.position.y);
      if (distance <= enemy.visionRange && distance < closestDistance) {
        closest = player;
        closestDistance = distance;
      }
    }
    return closest;
  }

  private moveTowardsPlayer(enemy: Enemy, player: Player): { x: number; y: number } | undefined {
    const x = player.position.x - enemy.position.x;
    const y = player.position.y - enemy.position.y;
    for (const direction of this.getDirectionsTowards(x, y)) {
      const position = this.world.moveObject(enemy.id, direction);
      if (position) {
        return position;
      }
    }
    return undefined;
  }

  private getDirectionsTowards(x: number, y: number): MoveType[] {
    const horizontal = x === 0 ? undefined : x > 0 ? "right" : "left";
    const vertical = y === 0 ? undefined : y > 0 ? "down" : "up";
    return Math.abs(x) >= Math.abs(y)
      ? [horizontal, vertical].filter((direction): direction is MoveType => Boolean(direction))
      : [vertical, horizontal].filter((direction): direction is MoveType => Boolean(direction));
  }
}
