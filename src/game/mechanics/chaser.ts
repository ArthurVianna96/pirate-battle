import { overlapsObstacle, type Obstacle, type Size } from './collisions';
import {
  createMovingEnemyState,
  type MovingEnemyState,
  type PlayerCombatState,
} from './combat';
import { updateEnemyMovement, type EnemyMovementWorld } from './enemyMovement';
import type { PlayerState, MovementConfig } from './simulation';

export const CHASER_CONFIG = {
  speed: 60,
  rotationSpeed: Math.PI / 2,
  impactDamage: 1,
} as const;

export interface ChaserConfig extends MovementConfig {
  impactDamage: number;
}

export type ChaserState = MovingEnemyState;

export function createChaserState(bounds: Obstacle): ChaserState {
  return createMovingEnemyState(bounds);
}

export function updateChaser(
  chaser: ChaserState,
  player: Pick<PlayerState, 'x' | 'y'>,
  deltaSeconds: number,
  world: EnemyMovementWorld,
  config: ChaserConfig = CHASER_CONFIG,
) {
  updateEnemyMovement(chaser, player, deltaSeconds, world, config);
}

export function resolveChaserImpact(
  chaser: ChaserState,
  player: PlayerCombatState,
  shipSize: Size,
  config: ChaserConfig = CHASER_CONFIG,
): boolean {
  if (chaser.health === 0 || player.health === 0) {
    return false;
  }
  if (!overlapsObstacle(player, shipSize, chaser.bounds)) {
    return false;
  }

  player.health = Math.max(0, player.health - config.impactDamage);
  chaser.health = 0;
  return true;
}
