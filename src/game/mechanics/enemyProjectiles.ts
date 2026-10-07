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

export function createEnemyProjectilesState() {
  return { nextId: 1, projectiles: [] as ProjectileState[] };
}

export type EnemyProjectilesState = ReturnType<
  typeof createEnemyProjectilesState
>;

export function fireEnemyFront(
  projectiles: EnemyProjectilesState,
  position: PlayerState,
  config: FrontWeaponConfig,
) {
  projectiles.projectiles.push(
    createFrontProjectile(projectiles.nextId++, position, config),
  );
}

export function updateEnemyProjectiles(
  projectiles: EnemyProjectilesState,
  deltaSeconds: number,
  player: PlayerCombatState,
  { arenaSize, shipSize, obstacles }: MovementWorld,
  onImpact?: (position: { x: number; y: number }) => void,
) {
  const playerBounds = getShipBounds(player, shipSize);
  for (const projectile of projectiles.projectiles) {
    const previousPosition = advanceProjectile(
      projectile,
      deltaSeconds,
      obstacles,
      onImpact,
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
      onImpact?.(projectile);
    }
  }
  projectiles.projectiles = projectiles.projectiles.filter((projectile) =>
    isProjectileActive(projectile, arenaSize),
  );
}
