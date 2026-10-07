import type { Obstacle, Size } from './collisions';
import type { PlayerState } from './simulation';

export const COMBAT_CONFIG = { playerHealth: 5, enemyHealth: 3 } as const;

export type EnemyKind = 'chaser' | 'shooter';

export interface PlayerCombatState extends PlayerState {
  health: number;
  maxHealth: number;
}

export interface EnemyState {
  bounds: Obstacle;
  health: number;
  maxHealth: number;
}

export interface MovingEnemyState extends EnemyState {
  position: PlayerState;
  shipSize: Size;
}

export function createMovingEnemyState(bounds: Obstacle): MovingEnemyState {
  return {
    ...createEnemyState({ ...bounds }),
    position: {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      heading: 0,
    },
    shipSize: { width: bounds.width, height: bounds.height },
  };
}

export function createEnemyState(bounds: Obstacle): EnemyState {
  return {
    bounds,
    health: COMBAT_CONFIG.enemyHealth,
    maxHealth: COMBAT_CONFIG.enemyHealth,
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
