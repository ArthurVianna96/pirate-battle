import type { Obstacle } from './collisions';
import { createMovingEnemyState, type MovingEnemyState } from './combat';
import { updateEnemyMovement, type EnemyMovementWorld } from './enemyMovement';
import type { MovementConfig, PlayerState } from './simulation';

export const shooterConfig = {
  speed: 45,
  rotationSpeed: Math.PI / 2,
  attackRange: 200,
} as const;

export interface ShooterConfig extends MovementConfig {
  attackRange: number;
}

export type ShooterState = MovingEnemyState;

export function createShooterState(bounds: Obstacle): ShooterState {
  return createMovingEnemyState(bounds);
}

export function updateShooter(
  shooter: ShooterState,
  player: Pick<PlayerState, 'x' | 'y'>,
  deltaSeconds: number,
  world: EnemyMovementWorld,
  config: ShooterConfig = shooterConfig,
) {
  updateEnemyMovement(shooter, player, deltaSeconds, world, {
    ...config,
    stopDistance: config.attackRange,
  });
}
