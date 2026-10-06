import type { Obstacle } from './collisions';

export interface EnemyState {
  bounds: Obstacle;
  health: number;
  maxHealth: number;
}

export function createEnemyState(bounds: Obstacle): EnemyState {
  return { bounds, health: 3, maxHealth: 3 };
}

export function damageEnemy(
  enemy: EnemyState,
  damage: number,
): { isDestroyed: boolean } {
  const wasAlive = enemy.health > 0;
  enemy.health = Math.max(0, enemy.health - damage);
  return { isDestroyed: wasAlive && enemy.health === 0 };
}
