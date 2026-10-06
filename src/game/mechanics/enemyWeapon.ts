import { getShipBounds, projectilePathHitsObstacle } from './collisions';
import type { PlayerCombatState } from './combat';
import type { MovementWorld, PlayerState } from './simulation';
import {
  advanceProjectile,
  createFrontProjectile,
  isProjectileActive,
  type FrontWeaponConfig,
  type ProjectileState,
} from './weapon';

export function createEnemyWeaponState() {
  return { nextId: 1, projectiles: [] as ProjectileState[] };
}

export type EnemyWeaponState = ReturnType<typeof createEnemyWeaponState>;

export function fireEnemyFront(
  weapon: EnemyWeaponState,
  position: PlayerState,
  config: FrontWeaponConfig,
) {
  weapon.projectiles.push(
    createFrontProjectile(weapon.nextId++, position, config),
  );
}

export function updateEnemyProjectiles(
  weapon: EnemyWeaponState,
  deltaSeconds: number,
  player: PlayerCombatState,
  { arenaSize, shipSize, obstacles }: MovementWorld,
) {
  const playerBounds = getShipBounds(player, shipSize);
  for (const projectile of weapon.projectiles) {
    const previousPosition = advanceProjectile(
      projectile,
      deltaSeconds,
      obstacles,
    );
    if (!previousPosition || player.health === 0) continue;
    if (
      projectilePathHitsObstacle(
        previousPosition,
        projectile,
        playerBounds,
        projectile.radius,
      )
    ) {
      player.health = Math.max(0, player.health - projectile.damage);
      projectile.remainingLife = 0;
    }
  }
  weapon.projectiles = weapon.projectiles.filter((projectile) =>
    isProjectileActive(projectile, arenaSize),
  );
}
