import { arenaScreenshot } from './helpers/arenaScreenshot';
import { expect, test } from '@playwright/test';
import { createEnemyState } from '../src/game/mechanics/combat';
import {
  createWeaponState,
  fireFront,
  fireSide,
  sideWeaponConfig,
  updateWeapon,
} from '../src/game/mechanics/weapon';

test('side shots remain parallel and rotate with the ship', () => {
  for (const heading of [0, Math.PI / 2, Math.PI / 4]) {
    for (const side of ['left', 'right'] as const) {
      const weapon = createWeaponState();
      const player = { x: 480, y: 270, heading };
      fireSide(weapon, player, side);
      expect(weapon.projectiles).toHaveLength(3);
      const direction =
        heading + (side === 'left' ? -Math.PI / 2 : Math.PI / 2);
      weapon.projectiles.forEach((projectile, index) => {
        expect(projectile.velocityX).toBeCloseTo(
          Math.sin(direction) * sideWeaponConfig.speed,
        );
        expect(projectile.velocityY).toBeCloseTo(
          -Math.cos(direction) * sideWeaponConfig.speed,
        );
        const offset = (index - 1) * sideWeaponConfig.spacing;
        expect(projectile.x).toBeCloseTo(
          player.x +
            Math.sin(direction) * sideWeaponConfig.muzzleOffset +
            Math.sin(heading) * offset,
        );
        expect(projectile.y).toBeCloseTo(
          player.y -
            Math.cos(direction) * sideWeaponConfig.muzzleOffset -
            Math.cos(heading) * offset,
        );
      });
    }
  }
});

test('front, left and right weapons have independent cooldowns', () => {
  const weapon = createWeaponState();
  const player = { x: 1000, y: 1000, heading: 0 };
  fireSide(weapon, player, 'left');
  fireSide(weapon, player, 'left');
  fireSide(weapon, player, 'right');
  fireFront(weapon, player);
  expect(weapon.projectiles).toHaveLength(7);
  updateWeapon(weapon, sideWeaponConfig.cooldown, {
    width: 2000,
    height: 2000,
  });
  fireSide(weapon, player, 'left');
  expect(weapon.projectiles).toHaveLength(10);
});

test('one broadside destroys the target and islands block all three shots', () => {
  const weapon = createWeaponState();
  const target = createEnemyState({
    x: 687,
    y: 213.5,
    width: 66,
    height: 113,
  });
  fireSide(weapon, { x: 480, y: 270, heading: 0 }, 'right');
  updateWeapon(weapon, 0.6, { width: 960, height: 540 }, [], [target]);
  expect(target.health).toBe(0);
  expect(weapon.projectiles).toHaveLength(0);

  fireSide(weapon, { x: 480, y: 270, heading: 0 }, 'left');
  updateWeapon(weapon, 0.6, { width: 960, height: 540 }, [
    { x: 144, y: 174, width: 192, height: 192 },
  ]);
  expect(weapon.projectiles).toHaveLength(0);
});

test('Q renders a broadside and E destroys the Chaser through keyboard input', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  const initial = await arenaScreenshot(page);
  await page.keyboard.down('q');
  await page.clock.runFor(32);
  await page.keyboard.up('q');
  expect((await arenaScreenshot(page)).equals(initial)).toBe(false);
  await page.clock.runFor(600);
  expect((await arenaScreenshot(page)).equals(initial)).toBe(true);
  await page.keyboard.down('e');
  await page.clock.runFor(32);
  await page.keyboard.up('e');
  await page.clock.runFor(800);
  const destroyed = await arenaScreenshot(page);
  await expect(page.getByText('Score: 1', { exact: true })).toBeVisible();
  await page.keyboard.down('e');
  await page.clock.runFor(32);
  await page.keyboard.up('e');
  await page.clock.runFor(2500);
  expect((await arenaScreenshot(page)).equals(destroyed)).toBe(true);
});
