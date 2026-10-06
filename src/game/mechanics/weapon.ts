import { damageTarget, type TargetState } from './combat';
import { projectilePathHitsObstacle, type Obstacle } from './collisions';
import type { PlayerState } from './simulation';

export const frontWeaponConfig = {
  speed: 320,
  lifetime: 2,
  cooldown: 0.4,
  muzzleOffset: 64,
  radius: 5,
  damage: 1,
} as const;

export const sideWeaponConfig = {
  ...frontWeaponConfig,
  cooldown: 0.8,
  muzzleOffset: 38,
  spacing: 28,
} as const;

export interface ProjectileState {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  remainingLife: number;
  damage: number;
  radius: number;
}

export function createWeaponState() {
  return {
    cooldown: 0,
    leftCooldown: 0,
    rightCooldown: 0,
    nextId: 1,
    projectiles: [] as ProjectileState[],
  };
}

type WeaponState = ReturnType<typeof createWeaponState>;

export function fireFront(weapon: WeaponState, player: PlayerState) {
  if (weapon.cooldown > 1e-9) return;
  const directionX = Math.sin(player.heading);
  const directionY = -Math.cos(player.heading);
  weapon.projectiles.push({
    id: weapon.nextId++,
    x: player.x + directionX * frontWeaponConfig.muzzleOffset,
    y: player.y + directionY * frontWeaponConfig.muzzleOffset,
    velocityX: directionX * frontWeaponConfig.speed,
    velocityY: directionY * frontWeaponConfig.speed,
    remainingLife: frontWeaponConfig.lifetime,
    damage: frontWeaponConfig.damage,
    radius: frontWeaponConfig.radius,
  });
  weapon.cooldown = frontWeaponConfig.cooldown;
}

export function fireSide(
  weapon: WeaponState,
  player: PlayerState,
  side: 'left' | 'right',
) {
  const cooldownKey = side === 'left' ? 'leftCooldown' : 'rightCooldown';
  if (weapon[cooldownKey] > 1e-9) return;

  const firingHeading =
    player.heading + (side === 'left' ? -Math.PI / 2 : Math.PI / 2);
  const directionX = Math.sin(firingHeading);
  const directionY = -Math.cos(firingHeading);
  const forwardX = Math.sin(player.heading);
  const forwardY = -Math.cos(player.heading);

  // Spread the cannons along the hull. All three shots travel in the same direction.
  for (const offset of [
    -sideWeaponConfig.spacing,
    0,
    sideWeaponConfig.spacing,
  ]) {
    weapon.projectiles.push({
      id: weapon.nextId++,
      x:
        player.x +
        directionX * sideWeaponConfig.muzzleOffset +
        forwardX * offset,
      y:
        player.y +
        directionY * sideWeaponConfig.muzzleOffset +
        forwardY * offset,
      velocityX: directionX * sideWeaponConfig.speed,
      velocityY: directionY * sideWeaponConfig.speed,
      remainingLife: sideWeaponConfig.lifetime,
      damage: sideWeaponConfig.damage,
      radius: sideWeaponConfig.radius,
    });
  }
  weapon[cooldownKey] = sideWeaponConfig.cooldown;
}

export function updateWeapon(
  weapon: WeaponState,
  deltaSeconds: number,
  arenaSize: { width: number; height: number },
  obstacles: readonly Obstacle[] = [],
  targets: readonly TargetState[] = [],
) {
  weapon.cooldown = Math.max(0, weapon.cooldown - deltaSeconds);
  weapon.leftCooldown = Math.max(0, weapon.leftCooldown - deltaSeconds);
  weapon.rightCooldown = Math.max(0, weapon.rightCooldown - deltaSeconds);
  for (const projectile of weapon.projectiles) {
    updateProjectile(projectile, deltaSeconds, obstacles, targets);
  }
  weapon.projectiles = weapon.projectiles.filter(
    (projectile) =>
      projectile.remainingLife > 1e-9 &&
      projectile.x >= 0 &&
      projectile.x <= arenaSize.width &&
      projectile.y >= 0 &&
      projectile.y <= arenaSize.height,
  );
}

function updateProjectile(
  projectile: ProjectileState,
  deltaSeconds: number,
  obstacles: readonly Obstacle[],
  targets: readonly TargetState[],
) {
  const previousPosition = { x: projectile.x, y: projectile.y };
  const travelSeconds = Math.min(deltaSeconds, projectile.remainingLife);
  projectile.x += projectile.velocityX * travelSeconds;
  projectile.y += projectile.velocityY * travelSeconds;
  projectile.remainingLife -= deltaSeconds;
  if (
    obstacles.some((obstacle) =>
      projectilePathHitsObstacle(
        previousPosition,
        projectile,
        obstacle,
        projectile.radius,
      ),
    )
  ) {
    projectile.remainingLife = 0;
    return;
  }
  for (const target of targets) {
    if (
      target.health > 0 &&
      projectilePathHitsObstacle(
        previousPosition,
        projectile,
        target.bounds,
        projectile.radius,
      )
    ) {
      damageTarget(target, projectile.damage);
      projectile.remainingLife = 0;
      break;
    }
  }
}
