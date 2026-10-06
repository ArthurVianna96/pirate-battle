import { expect, test } from '@playwright/test';
import { constrainPlayerToArena } from '../src/game/mechanics/collisions';
import {
  movementConfig,
  applyPlayerMovement,
} from '../src/game/mechanics/simulation';

test('movement cannot take the ship through any arena edge', () => {
  const arena = { width: 960, height: 540 };
  const ship = { width: 64, height: 112 };
  const cases = [
    { heading: 0, x: 480, y: 56 },
    { heading: Math.PI / 2, x: 904, y: 270 },
    { heading: Math.PI, x: 480, y: 484 },
    { heading: -Math.PI / 2, x: 56, y: 270 },
  ];

  for (const expected of cases) {
    const player = { x: 480, y: 270, heading: expected.heading };
    applyPlayerMovement(
      player,
      { forward: true, turnLeft: false, turnRight: false },
      10,
      movementConfig,
    );
    constrainPlayerToArena(player, ship, arena);
    expect(player.x).toBeCloseTo(expected.x);
    expect(player.y).toBeCloseTo(expected.y);
  }
});

test('rotating at a corner keeps every ship corner within the arena', () => {
  const ship = { width: 64, height: 112 };
  const arena = { width: 960, height: 540 };
  const player = { x: 32, y: 56, heading: Math.PI / 4 };
  constrainPlayerToArena(player, ship, arena);

  for (const x of [-ship.width / 2, ship.width / 2]) {
    for (const y of [-ship.height / 2, ship.height / 2]) {
      const worldX =
        player.x + x * Math.cos(player.heading) - y * Math.sin(player.heading);
      const worldY =
        player.y + x * Math.sin(player.heading) + y * Math.cos(player.heading);
      expect(worldX).toBeGreaterThanOrEqual(-0.00001);
      expect(worldX).toBeLessThanOrEqual(arena.width);
      expect(worldY).toBeGreaterThanOrEqual(-0.00001);
      expect(worldY).toBeLessThanOrEqual(arena.height);
    }
  }
});

test('holding forward stops at the edge and stays blocked after resize', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));

  const initial = await page.locator('canvas').screenshot();
  await page.keyboard.down('w');
  await page.clock.runFor(3000);
  const atEdge = await page.locator('canvas').screenshot();
  expect(atEdge.equals(initial)).toBe(false);
  await page.clock.runFor(1000);
  expect((await page.locator('canvas').screenshot()).equals(atEdge)).toBe(true);

  await page.setViewportSize({ width: 640, height: 800 });
  const resized = await page.locator('canvas').screenshot();
  await page.clock.runFor(1000);
  expect((await page.locator('canvas').screenshot()).equals(resized)).toBe(
    true,
  );
  await page.keyboard.up('w');
});
