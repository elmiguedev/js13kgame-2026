import type Enemy from "./Enemy";
import type EnemyTotem from "./EnemyTotem";
import type Player from "./Player";
import type Projectile from "./Projectile";

export default interface GameState {
  players: Player[];
  enemies: Enemy[];
  totems: EnemyTotem[];
  projectiles: Projectile[];
}
