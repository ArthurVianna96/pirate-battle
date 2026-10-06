import { expect, test } from '@playwright/test';
import { createTargetState } from '../src/game/mechanics/combat';
import {
  createWeaponState,
  fireFront,
  updateWeapon,
} from '../src/game/mechanics/weapon';

test('three hits destroy the target and each projectile deals damage once', () => {
  const target = createTargetState({
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
  const target = createTargetState({ x: 750, y: 230, width: 66, height: 113 });
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

test('keyboard shots change target health and destruction removes its rendering', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await page.keyboard.down('d');
  await page.clock.runFor(500);
  await page.keyboard.up('d');
  const initial = await page.locator('canvas').screenshot();
  await page.keyboard.down('Space');
  await page.clock.runFor(32);
  await page.keyboard.up('Space');
  await page.clock.runFor(800);
  const damaged = await page.locator('canvas').screenshot();
  expect(damaged.equals(initial)).toBe(false);
  await page.keyboard.down('Space');
  await page.clock.runFor(900);
  await page.keyboard.up('Space');
  await page.clock.runFor(2500);
  const destroyed = await page.locator('canvas').screenshot();
  expect(destroyed.equals(damaged)).toBe(false);
  await page.keyboard.down('Space');
  await page.clock.runFor(32);
  await page.keyboard.up('Space');
  await page.clock.runFor(2500);
  expect((await page.locator('canvas').screenshot()).equals(destroyed)).toBe(
    true,
  );
});
