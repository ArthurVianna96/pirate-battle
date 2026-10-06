import type { Obstacle } from './collisions';
import { createMovingEnemyState, type MovingEnemyState } from './combat';
import { updateEnemyMovement, type EnemyMovementWorld } from './enemyMovement';
import type { MovementConfig, PlayerState } from './simulation';
import type { PlayerCombatState } from './combat';
import { fireEnemyFront, type EnemyWeaponState } from './enemyWeapon';
import { frontWeaponConfig } from './weapon';

export const shooterConfig = {
  speed: 45,
  rotationSpeed: Math.PI / 2,
  attackRange: 200,
  aimTolerance: 0.1,
} as const;

export const shooterWeaponConfig = {
  ...frontWeaponConfig,
  speed: 220,
  lifetime: 3,
  cooldown: 1.2,
} as const;

export interface ShooterConfig extends MovementConfig {
  attackRange: number;
  aimTolerance: number;
}

export interface ShooterState extends MovingEnemyState {
  fireCooldown: number;
}

export function createShooterState(bounds: Obstacle): ShooterState {
  return { ...createMovingEnemyState(bounds), fireCooldown: 0 };
}

export function updateShooterAttack(
  shooter: ShooterState,
  player: PlayerCombatState,
  deltaSeconds: number,
  weapon: EnemyWeaponState,
  config: ShooterConfig = shooterConfig,
) {
  if (shooter.health === 0 || player.health === 0) return;
  shooter.fireCooldown = Math.max(0, shooter.fireCooldown - deltaSeconds);
  if (shooter.fireCooldown > 1e-9) return;

  const distanceX = player.x - shooter.position.x;
  const distanceY = player.y - shooter.position.y;
  if (Math.hypot(distanceX, distanceY) > config.attackRange + 1e-9) return;
  const desiredHeading = Math.atan2(distanceX, -distanceY);
  const headingDifference = desiredHeading - shooter.position.heading;
  const aimError = Math.atan2(
    Math.sin(headingDifference),
    Math.cos(headingDifference),
  );
  if (Math.abs(aimError) > config.aimTolerance) return;

  fireEnemyFront(weapon, shooter.position, shooterWeaponConfig);
  shooter.fireCooldown = shooterWeaponConfig.cooldown;
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
