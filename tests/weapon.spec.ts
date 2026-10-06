import { expect, test } from '@playwright/test';
import {
  createWeaponState,
  fireFront,
  updateWeapon,
  frontWeaponConfig,
} from '../src/game/weapon';

test('the cooldown blocks repeated calls and permits the next shot', () => {
  const weapon = createWeaponState();
  const player = { x: 400, y: 400, heading: 0 };
  fireFront(weapon, player);
  fireFront(weapon, player);
  expect(weapon.projectiles).toHaveLength(1);
  updateWeapon(weapon, frontWeaponConfig.cooldown, {
    width: 2000,
    height: 2000,
  });
  fireFront(weapon, player);
  expect(weapon.projectiles).toHaveLength(2);
});

test('projectiles retain the firing direction when the ship turns', () => {
  const weapon = createWeaponState();
  const player = { x: 400, y: 400, heading: Math.PI / 2 };
  fireFront(weapon, player);
  player.heading = 0;
  updateWeapon(weapon, 0.25, { width: 2000, height: 2000 });
  expect(weapon.projectiles[0].x).toBeCloseTo(544);
  expect(weapon.projectiles[0].y).toBeCloseTo(400);
});

test('expired projectiles and projectiles outside the arena are removed', () => {
  const player = { x: 400, y: 1200, heading: 0 };
  const expired = createWeaponState();
  fireFront(expired, player);
  for (let frame = 0; frame < 120; frame++) {
    updateWeapon(expired, 1 / 60, { width: 2000, height: 2000 });
  }
  expect(expired.projectiles).toHaveLength(0);

  const escaped = createWeaponState();
  fireFront(escaped, { x: 400, y: 100, heading: 0 });
  updateWeapon(escaped, 0.5, { width: 960, height: 540 });
  expect(escaped.projectiles).toHaveLength(0);
});

test('holding fire produces the same shot count at 30 and 60 FPS', () => {
  function shoot(frames: number) {
    const weapon = createWeaponState();
    for (let frame = 0; frame < frames; frame++) {
      fireFront(weapon, { x: 400, y: 1200, heading: 0 });
      updateWeapon(weapon, 1 / frames, { width: 2000, height: 2000 });
    }
    return weapon.nextId - 1;
  }
  expect(shoot(30)).toBe(3);
  expect(shoot(60)).toBe(3);
});

test('Space renders a projectile and its removal restores the arena', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  const initial = await page.locator('canvas').screenshot();
  await page.keyboard.down('Space');
  await page.clock.runFor(32);
  await page.keyboard.up('Space');
  expect((await page.locator('canvas').screenshot()).equals(initial)).toBe(
    false,
  );
  await page.clock.runFor(2000);
  expect((await page.locator('canvas').screenshot()).equals(initial)).toBe(
    true,
  );

  await page.keyboard.down('w');
  await page.keyboard.down('Space');
  await page.clock.runFor(200);
  await page.keyboard.up('w');
  await page.keyboard.up('Space');
  const movingAndFiring = await page.locator('canvas').screenshot();
  await page.clock.runFor(2000);
  const moved = await page.locator('canvas').screenshot();
  expect(movingAndFiring.equals(moved)).toBe(false);
  expect(moved.equals(initial)).toBe(false);
});
