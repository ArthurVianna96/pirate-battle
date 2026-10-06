import { expect, test } from '@playwright/test';
import { createEnemyState } from '../src/game/mechanics/combat';
import {
  createWeaponState,
  fireFront,
  updateWeapon,
} from '../src/game/mechanics/weapon';

test('three hits destroy the target and each projectile deals damage once', () => {
  const target = createEnemyState({
    x: 687,
    y: 213.5,
    width: 66,
    height: 113,
  });
  const weapon = createWeaponState();
  const player = { x: 480, y: 270, heading: Math.PI / 2 };
  for (let hit = 1; hit <= 3; hit++) {
    fireFront(weapon, player);
    updateWeapon(weapon, 0.5, { width: 960, height: 540 }, [], [target]);
    expect(target.health).toBe(3 - hit);
    expect(weapon.projectiles).toHaveLength(0);
    updateWeapon(weapon, 0.1, { width: 960, height: 540 }, [], [target]);
    expect(target.health).toBe(3 - hit);
  }
  fireFront(weapon, player);
  updateWeapon(weapon, 0.5, { width: 960, height: 540 }, [], [target]);
  expect(target.health).toBe(0);
  expect(weapon.projectiles).toHaveLength(1);
});

test('an island protects the target behind it', () => {
  const target = createEnemyState({ x: 750, y: 230, width: 66, height: 113 });
  const weapon = createWeaponState();
  fireFront(weapon, { x: 480, y: 270, heading: Math.PI / 2 });
  updateWeapon(
    weapon,
    1,
    { width: 960, height: 540 },
    [{ x: 600, y: 200, width: 100, height: 150 }],
    [target],
  );
  expect(target.health).toBe(3);
  expect(weapon.projectiles).toHaveLength(0);
});

test('destroying the Chaser removes its rendering and stops its movement', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  const initial = await page.locator('canvas').screenshot();
  await page.keyboard.down('e');
  await page.clock.runFor(32);
  await page.keyboard.up('e');
  await page.clock.runFor(800);
  await expect(page.getByText('Score: 1', { exact: true })).toBeVisible();
  await page.clock.runFor(650);
  const destroyed = await page.locator('canvas').screenshot();
  expect(destroyed.equals(initial)).toBe(false);
  await page.clock.runFor(500);
  expect((await page.locator('canvas').screenshot()).equals(destroyed)).toBe(
    true,
  );
});
