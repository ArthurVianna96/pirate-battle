import { expect, test } from '@playwright/test';
import { movementConfig, updatePlayer } from '../src/game/simulation';

test('one second of movement covers the same distance at 30 and 60 FPS', () => {
  function advance(frames: number) {
    const player = { x: 480, y: 270 };
    for (let frame = 0; frame < frames; frame++) {
      updatePlayer(player, { forward: true }, 1 / frames, movementConfig);
    }
    return player;
  }

  expect(advance(30).y).toBeCloseTo(advance(60).y);
  expect(advance(60).y).toBeCloseTo(150);
});

test('holding W moves the rendered ship and releasing stops it', async ({
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
  await page.clock.runFor(500);
  await page.keyboard.up('w');
  await page.clock.runFor(50);
  const moved = await page.locator('canvas').screenshot();
  expect(moved.equals(initial)).toBe(false);

  await page.clock.runFor(500);
  const stopped = await page.locator('canvas').screenshot();
  expect(stopped.equals(moved)).toBe(true);
});
