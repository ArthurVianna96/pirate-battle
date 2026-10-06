import { expect, test } from '@playwright/test';
import { createChaserState, updateChaser } from '../src/game/mechanics/chaser';
import { overlapsObstacle } from '../src/game/mechanics/collisions';
import { arenaScreenshot } from './helpers/arenaScreenshot';

const world = { arenaSize: { width: 960, height: 540 }, obstacles: [] };

test('the live arena renders Chaser movement without player input', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  const region = { x: 560, y: 100, width: 240, height: 300 };
  const before = await arenaScreenshot(page, region);
  await page.clock.runFor(1000);
  expect((await arenaScreenshot(page, region)).equals(before)).toBe(false);
  await expect(page.getByText('Score: 0', { exact: true })).toBeVisible();
});

test('pursuit follows the same path at 30 and 60 FPS', () => {
  function pursue(fps: number) {
    const chaser = createChaserState({
      x: 687,
      y: 213.5,
      width: 66,
      height: 113,
    });
    for (let frame = 0; frame < fps * 2; frame++) {
      updateChaser(chaser, { x: 480, y: 270 }, 1 / fps, world);
    }
    return chaser.position;
  }
  const slow = pursue(30);
  const fast = pursue(60);
  expect(slow.x).toBeCloseTo(fast.x);
  expect(slow.y).toBeCloseTo(fast.y);
  expect(slow.heading).toBeCloseTo(fast.heading);
  expect(slow.x).toBeLessThan(720);
});

test('the Chaser cannot cross an island even during a long update', () => {
  const chaser = createChaserState({
    x: 447,
    y: 213.5,
    width: 66,
    height: 113,
  });
  chaser.position.heading = -Math.PI / 2;
  const island = { x: 144, y: 174, width: 192, height: 192 };
  updateChaser(chaser, { x: 50, y: 270 }, 5, { ...world, obstacles: [island] });
  expect(overlapsObstacle(chaser.position, chaser.shipSize, island)).toBe(
    false,
  );
  expect(chaser.bounds.x).toBeCloseTo(island.x + island.width);
});

test('pursuit reaches the player and destroyed Chasers do not move', () => {
  const chaser = createChaserState({
    x: 447,
    y: 373.5,
    width: 66,
    height: 113,
  });
  updateChaser(chaser, { x: 480, y: 270 }, 5, world);
  expect(chaser.position.x).toBeCloseTo(480);
  expect(chaser.position.y).toBeCloseTo(270);
  chaser.health = 0;
  const previous = { ...chaser.position };
  updateChaser(chaser, { x: 800, y: 100 }, 1, world);
  expect(chaser.position).toEqual(previous);
});
