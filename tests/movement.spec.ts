import { expect, test } from '@playwright/test';
import {
  movementConfig,
  applyPlayerMovement,
} from '../src/game/mechanics/simulation';

test('turning while advancing follows the same arc at 30 and 60 FPS', () => {
  function advance(frames: number) {
    const player = { x: 480, y: 270, heading: 0 };
    for (let frame = 0; frame < frames; frame++) {
      applyPlayerMovement(
        player,
        { forward: true, turnLeft: false, turnRight: true },
        0.5 / frames,
        movementConfig,
      );
    }
    return player;
  }

  const at30 = advance(30);
  const at60 = advance(60);
  expect(at30.x).toBeCloseTo(at60.x);
  expect(at30.y).toBeCloseTo(at60.y);
  expect(at60.heading).toBeCloseTo(Math.PI / 2);
  expect(at60.x).toBeGreaterThan(480);
  expect(at60.y).toBeLessThan(270);
});

test('left and right turn in opposite directions and cancel together', () => {
  const left = { x: 480, y: 270, heading: 0 };
  const right = { ...left };
  const both = { ...left };
  applyPlayerMovement(
    left,
    { forward: false, turnLeft: true, turnRight: false },
    0.5,
    movementConfig,
  );
  applyPlayerMovement(
    right,
    { forward: false, turnLeft: false, turnRight: true },
    0.5,
    movementConfig,
  );
  applyPlayerMovement(
    both,
    { forward: false, turnLeft: true, turnRight: true },
    0.5,
    movementConfig,
  );
  expect(left.heading).toBeCloseTo(-Math.PI / 2);
  expect(right.heading).toBeCloseTo(Math.PI / 2);
  expect(both.heading).toBe(0);
});

test('keyboard rotation works together with forward movement', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));

  const initial = await page.locator('canvas').screenshot();
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(250);
  const turned = await page.locator('canvas').screenshot();
  expect(turned.equals(initial)).toBe(false);

  await page.keyboard.down('w');
  await page.clock.runFor(250);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('w');
  await page.clock.runFor(50);
  const moved = await page.locator('canvas').screenshot();
  expect(moved.equals(turned)).toBe(false);
  await page.clock.runFor(500);
  expect((await page.locator('canvas').screenshot()).equals(moved)).toBe(true);
});

test('one second of movement covers the same distance at 30 and 60 FPS', () => {
  function advance(frames: number) {
    const player = { x: 480, y: 270, heading: 0 };
    for (let frame = 0; frame < frames; frame++) {
      applyPlayerMovement(
        player,
        { forward: true, turnLeft: false, turnRight: false },
        1 / frames,
        movementConfig,
      );
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
