import { expect, test } from '@playwright/test';
import { createEnemyState, damageEnemy } from '../src/game/mechanics/combat';
import {
  createWeaponState,
  fireFront,
  fireSide,
  updateWeapon,
} from '../src/game/mechanics/weapon';

test('damage reports destruction only once', () => {
  const target = createEnemyState({ x: 0, y: 0, width: 66, height: 113 });
  expect(damageEnemy(target, 1)).toEqual({ isDestroyed: false });
  expect(damageEnemy(target, 5)).toEqual({ isDestroyed: true });
  expect(damageEnemy(target, 1)).toEqual({ isDestroyed: false });
  expect(target.health).toBe(0);
});

test('missed shots and island impacts award no points', () => {
  const weapon = createWeaponState();
  const player = { x: 480, y: 270, heading: 0 };
  const target = createEnemyState({
    x: 687,
    y: 213.5,
    width: 66,
    height: 113,
  });
  const arena = { width: 960, height: 540 };
  const obstacles = [{ x: 144, y: 174, width: 192, height: 192 }];
  fireFront(weapon, player);
  for (let frame = 0; frame < 120; frame++) {
    expect(updateWeapon(weapon, 1 / 60, arena, obstacles, [target])).toBe(0);
  }
  fireSide(weapon, player, 'left');
  expect(updateWeapon(weapon, 0.6, arena, obstacles, [target])).toBe(0);
  expect(target.health).toBe(3);
});

test('firing away from the target keeps the visible score at zero', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  for (const key of ['Space', 'q']) {
    await page.keyboard.down(key);
    await page.clock.runFor(100);
    await expect(page.getByText('Score: 0', { exact: true })).toBeVisible();
    await page.clock.runFor(1000);
    await page.keyboard.up(key);
    await expect(page.getByText('Score: 0', { exact: true })).toBeVisible();
  }
});

test('weapon updates count destroyed targets rather than individual hits', () => {
  const target = createEnemyState({
    x: 687,
    y: 213.5,
    width: 66,
    height: 113,
  });
  const weapon = createWeaponState();
  const player = { x: 480, y: 270, heading: Math.PI / 2 };
  fireFront(weapon, player);
  expect(
    updateWeapon(weapon, 0.6, { width: 960, height: 540 }, [], [target]),
  ).toBe(0);
  fireSide(weapon, { ...player, heading: 0 }, 'right');
  expect(
    updateWeapon(weapon, 0.6, { width: 960, height: 540 }, [], [target]),
  ).toBe(1);
  expect(
    updateWeapon(weapon, 0.6, { width: 960, height: 540 }, [], [target]),
  ).toBe(0);
});

for (const attack of ['front', 'side'] as const) {
  test(`${attack} destruction awards one point and a new game resets score`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.goto('/');
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByRole('status')).toHaveCount(0);
    await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
    await expect(page.getByText('Score: 0', { exact: true })).toBeVisible();
    if (attack === 'front') {
      await page.keyboard.down('d');
      await page.clock.runFor(500);
      await page.keyboard.up('d');
    }
    const key = attack === 'front' ? 'Space' : 'e';
    const shots = attack === 'front' ? 3 : 1;
    for (let shot = 0; shot < shots; shot++) {
      await page.keyboard.down(key);
      await page.clock.runFor(32);
      await page.keyboard.up(key);
      await page.clock.runFor(attack === 'front' ? 420 : 800);
      await expect(
        page.getByText(`Score: ${shot === shots - 1 ? 1 : 0}`, { exact: true }),
      ).toBeVisible();
    }
    await page.keyboard.down(key);
    await page.clock.runFor(1000);
    await page.keyboard.up(key);
    await expect(page.getByText('Score: 1', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.getByText('Score: 0', { exact: true })).toBeVisible();
  });
}
