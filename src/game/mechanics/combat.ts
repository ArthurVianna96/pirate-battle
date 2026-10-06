import type { Obstacle } from './collisions';
import type { PlayerState } from './simulation';

export const combatConfig = { playerHealth: 5, enemyHealth: 3 } as const;

export interface PlayerCombatState extends PlayerState {
  health: number;
  maxHealth: number;
}

export function createPlayerState(position: PlayerState): PlayerCombatState {
  return {
    ...position,
    health: combatConfig.playerHealth,
    maxHealth: combatConfig.playerHealth,
  };
}

export interface EnemyState {
  bounds: Obstacle;
  health: number;
  maxHealth: number;
}

export function createEnemyState(bounds: Obstacle): EnemyState {
  return {
    bounds,
    health: combatConfig.enemyHealth,
    maxHealth: combatConfig.enemyHealth,
  };
}

export function damageEnemy(
  enemy: EnemyState,
  damage: number,
): { isDestroyed: boolean } {
  const wasAlive = enemy.health > 0;
  enemy.health = Math.max(0, enemy.health - damage);
  return { isDestroyed: wasAlive && enemy.health === 0 };
}
