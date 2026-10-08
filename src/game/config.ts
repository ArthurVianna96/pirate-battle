import type { EnemyKind } from './mechanics/combat';
import type { MovementConfig } from './mechanics/simulation';
import type { FrontWeaponConfig } from './mechanics/weapon';
import type { ChaserConfig } from './mechanics/chaser';
import type { ShooterConfig } from './mechanics/shooter';

export const MATCH_CONFIG = {
  duration: 60,
  minDuration: 60,
  maxDuration: 180,
} as const;

export const OPTIONS_CONFIG = {
  minSpawnInterval: 1,
  maxSpawnInterval: 30,
} as const;

export const COMBAT_CONFIG = { playerHealth: 5, enemyHealth: 3 } as const;

export const MOVEMENT_CONFIG = {
  speed: 120,
  rotationSpeed: Math.PI,
} as const satisfies MovementConfig;

export const FRONT_WEAPON_CONFIG = {
  speed: 320,
  lifetime: 2,
  cooldown: 0.4,
  muzzleOffset: 64,
  radius: 5,
  damage: 1,
} as const satisfies FrontWeaponConfig;

export const SIDE_WEAPON_CONFIG = {
  ...FRONT_WEAPON_CONFIG,
  cooldown: 0.8,
  muzzleOffset: 38,
  spacing: 28,
} as const satisfies FrontWeaponConfig & { spacing: number };

export const CHASER_CONFIG = {
  speed: 60,
  rotationSpeed: Math.PI / 2,
  impactDamage: 1,
} as const satisfies ChaserConfig;

export const SHOOTER_CONFIG = {
  speed: 45,
  rotationSpeed: Math.PI / 2,
  attackRange: 200,
  aimTolerance: 0.1,
} as const satisfies ShooterConfig;

export const SHOOTER_WEAPON_CONFIG = {
  ...FRONT_WEAPON_CONFIG,
  speed: 220,
  lifetime: 3,
  cooldown: 1.2,
} as const satisfies FrontWeaponConfig;

export const SPAWN_CONFIG = {
  interval: 4,
  minPlayerDistance: 220,
  enemyOrder: ['chaser', 'shooter'] satisfies EnemyKind[],
  initialChaser: { x: 0.75, y: 0.5 },
  initialShooter: { x: 0.85, y: 0.85 },
  positions: [
    { x: 0.75, y: 0.5 },
    { x: 0.85, y: 0.25 },
    { x: 0.85, y: 0.8 },
    { x: 0.1, y: 0.2 },
    { x: 0.1, y: 0.8 },
  ],
} as const;
