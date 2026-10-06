import type { PlayerState } from './simulation';

export const frontWeaponConfig = {
  speed: 320,
  lifetime: 2,
  cooldown: 0.4,
  muzzleOffset: 64,
} as const;

export interface ProjectileState {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  remainingLife: number;
}

export function createWeaponState() {
  return { cooldown: 0, nextId: 1, projectiles: [] as ProjectileState[] };
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
  });
  weapon.cooldown = frontWeaponConfig.cooldown;
}

export function updateWeapon(
  weapon: WeaponState,
  deltaSeconds: number,
  arenaSize: { width: number; height: number },
) {
  weapon.cooldown = Math.max(0, weapon.cooldown - deltaSeconds);
  for (const projectile of weapon.projectiles) {
    projectile.x += projectile.velocityX * deltaSeconds;
    projectile.y += projectile.velocityY * deltaSeconds;
    projectile.remainingLife -= deltaSeconds;
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
