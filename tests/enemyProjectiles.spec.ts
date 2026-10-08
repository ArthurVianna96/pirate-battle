import { SHOOTER_WEAPON_CONFIG } from '../src/game/config';
import { expect, test } from '@playwright/test';
import { createPlayerState } from '../src/game/mechanics/player';
import {
  createEnemyProjectilesState,
  fireEnemyFront,
  updateEnemyProjectiles,
} from '../src/game/mechanics/enemyProjectiles';
import {
  createShooterState,
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
  return { shooter, player, projectiles: createEnemyProjectilesState() };
}

test('a Shooter fires only when alive, in range and aimed at the living player', () => {
  const { shooter, player, projectiles } = setup();
  shooter.position.x = 700;
  updateShooterAttack(shooter, player, 0, projectiles);
  expect(projectiles.projectiles).toHaveLength(0);
  shooter.position.x = 680;
  shooter.position.heading = 0;
  updateShooterAttack(shooter, player, 0, projectiles);
  expect(projectiles.projectiles).toHaveLength(0);
  shooter.position.heading = -Math.PI / 2;
  shooter.health = 0;
  updateShooterAttack(shooter, player, 0, projectiles);
  expect(projectiles.projectiles).toHaveLength(0);
  shooter.health = 3;
  player.health = 0;
  updateShooterAttack(shooter, player, 0, projectiles);
  expect(projectiles.projectiles).toHaveLength(0);
  player.health = 5;
  updateShooterAttack(shooter, player, 0, projectiles);
  expect(projectiles.projectiles).toHaveLength(1);
});

test('Shooter cooldowns agree at 30 and 60 FPS and belong to each ship', () => {
  for (const fps of [30, 60]) {
    const { shooter, player, projectiles } = setup();
    updateShooterAttack(shooter, player, 0, projectiles);
    for (let frame = 0; frame < fps * 2.4; frame++) {
      updateShooterAttack(shooter, player, 1 / fps, projectiles);
    }
    expect(projectiles.projectiles).toHaveLength(3);
    const other = setup().shooter;
    updateShooterAttack(other, player, 0, projectiles);
    expect(projectiles.projectiles).toHaveLength(4);
    expect(new Set(projectiles.projectiles.map(({ id }) => id)).size).toBe(4);
  }
});

test('an in-flight enemy shot deals damage once even after its Shooter dies', () => {
  const { shooter, player, projectiles } = setup();
  updateShooterAttack(shooter, player, 0, projectiles);
  shooter.health = 0;
  updateEnemyProjectiles(projectiles, 1, player, world);
  expect(player.health).toBe(4);
  expect(projectiles.projectiles).toHaveLength(0);
  updateEnemyProjectiles(projectiles, 1, player, world);
  expect(player.health).toBe(4);
});

test('islands intercept enemy shots before player damage', () => {
  const { shooter, player, projectiles } = setup();
  updateShooterAttack(shooter, player, 0, projectiles);
  updateEnemyProjectiles(projectiles, 1, player, {
    ...world,
    obstacles: [{ x: 560, y: 200, width: 20, height: 140 }],
  });
  expect(player.health).toBe(5);
  expect(projectiles.projectiles).toHaveLength(0);
});

test('expired enemy shots and shots outside the arena are removed', () => {
  const { player, projectiles } = setup();
  fireEnemyFront(
    projectiles,
    { x: 900, y: 270, heading: -Math.PI / 2 },
    { ...SHOOTER_WEAPON_CONFIG, lifetime: 0.1 },
  );
  updateEnemyProjectiles(projectiles, 1, player, world);
  expect(projectiles.projectiles).toHaveLength(0);
  expect(player.health).toBe(5);
  fireEnemyFront(
    projectiles,
    { x: 480, y: 80, heading: 0 },
    SHOOTER_WEAPON_CONFIG,
  );
  updateEnemyProjectiles(projectiles, 0.2, player, world);
  expect(projectiles.projectiles).toHaveLength(0);
});

test('enemy projectile damage clamps player health at zero', () => {
  const { shooter, player, projectiles } = setup();
  player.health = 1;
  fireEnemyFront(projectiles, shooter.position, {
    ...SHOOTER_WEAPON_CONFIG,
    damage: 2,
  });
  updateEnemyProjectiles(projectiles, 1, player, world);
  expect(player.health).toBe(0);
});
