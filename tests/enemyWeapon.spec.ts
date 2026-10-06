import { expect, test } from '@playwright/test';
import { createPlayerState } from '../src/game/mechanics/combat';
import {
  createEnemyWeaponState,
  fireEnemyFront,
  updateEnemyProjectiles,
} from '../src/game/mechanics/enemyWeapon';
import {
  createShooterState,
  shooterWeaponConfig,
  updateShooterAttack,
} from '../src/game/mechanics/shooter';

const world = {
  shipSize: { width: 66, height: 113 },
  arenaSize: { width: 960, height: 540 },
  obstacles: [],
};

function setup() {
  const shooter = createShooterState({ x: 647, y: 213.5, ...world.shipSize });
  shooter.position.heading = -Math.PI / 2;
  const player = createPlayerState({ x: 480, y: 270, heading: 0 });
  return { shooter, player, weapon: createEnemyWeaponState() };
}

test('a Shooter fires only when alive, in range and aimed at the living player', () => {
  const { shooter, player, weapon } = setup();
  shooter.position.x = 700;
  updateShooterAttack(shooter, player, 0, weapon);
  expect(weapon.projectiles).toHaveLength(0);
  shooter.position.x = 680;
  shooter.position.heading = 0;
  updateShooterAttack(shooter, player, 0, weapon);
  expect(weapon.projectiles).toHaveLength(0);
  shooter.position.heading = -Math.PI / 2;
  shooter.health = 0;
  updateShooterAttack(shooter, player, 0, weapon);
  expect(weapon.projectiles).toHaveLength(0);
  shooter.health = 3;
  player.health = 0;
  updateShooterAttack(shooter, player, 0, weapon);
  expect(weapon.projectiles).toHaveLength(0);
  player.health = 5;
  updateShooterAttack(shooter, player, 0, weapon);
  expect(weapon.projectiles).toHaveLength(1);
});

test('Shooter cooldowns agree at 30 and 60 FPS and belong to each ship', () => {
  for (const fps of [30, 60]) {
    const { shooter, player, weapon } = setup();
    updateShooterAttack(shooter, player, 0, weapon);
    for (let frame = 0; frame < fps * 2.4; frame++)
      updateShooterAttack(shooter, player, 1 / fps, weapon);
    expect(weapon.projectiles).toHaveLength(3);
    const other = setup().shooter;
    updateShooterAttack(other, player, 0, weapon);
    expect(weapon.projectiles).toHaveLength(4);
    expect(new Set(weapon.projectiles.map(({ id }) => id)).size).toBe(4);
  }
});

test('an in-flight enemy shot deals damage once even after its Shooter dies', () => {
  const { shooter, player, weapon } = setup();
  updateShooterAttack(shooter, player, 0, weapon);
  shooter.health = 0;
  updateEnemyProjectiles(weapon, 1, player, world);
  expect(player.health).toBe(4);
  expect(weapon.projectiles).toHaveLength(0);
  updateEnemyProjectiles(weapon, 1, player, world);
  expect(player.health).toBe(4);
});

test('islands intercept enemy shots before player damage', () => {
  const { shooter, player, weapon } = setup();
  updateShooterAttack(shooter, player, 0, weapon);
  updateEnemyProjectiles(weapon, 1, player, {
    ...world,
    obstacles: [{ x: 560, y: 200, width: 20, height: 140 }],
  });
  expect(player.health).toBe(5);
  expect(weapon.projectiles).toHaveLength(0);
});

test('expired enemy shots and shots outside the arena are removed', () => {
  const { player, weapon } = setup();
  fireEnemyFront(
    weapon,
    { x: 900, y: 270, heading: -Math.PI / 2 },
    { ...shooterWeaponConfig, lifetime: 0.1 },
  );
  updateEnemyProjectiles(weapon, 1, player, world);
  expect(weapon.projectiles).toHaveLength(0);
  expect(player.health).toBe(5);
  fireEnemyFront(weapon, { x: 480, y: 80, heading: 0 }, shooterWeaponConfig);
  updateEnemyProjectiles(weapon, 0.2, player, world);
  expect(weapon.projectiles).toHaveLength(0);
});

test('enemy projectile damage clamps player health at zero', () => {
  const { shooter, player, weapon } = setup();
  player.health = 1;
  fireEnemyFront(weapon, shooter.position, {
    ...shooterWeaponConfig,
    damage: 2,
  });
  updateEnemyProjectiles(weapon, 1, player, world);
  expect(player.health).toBe(0);
});
