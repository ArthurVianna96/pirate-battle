import { expect, test } from '@playwright/test';
import { createChaserState, updateChaser } from '../src/game/mechanics/chaser';
import { overlapsObstacle } from '../src/game/mechanics/collisions';

const world = { arenaSize: { width: 960, height: 540 }, obstacles: [] };

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

test('pursuit stops nearby and destroyed Chasers do not move', () => {
  const chaser = createChaserState({
    x: 447,
    y: 313.5,
    width: 66,
    height: 113,
  });
  updateChaser(chaser, { x: 480, y: 270 }, 5, world);
  expect(chaser.position.x).toBeCloseTo(480);
  expect(chaser.position.y).toBeCloseTo(350);
  chaser.health = 0;
  const previous = { ...chaser.position };
  updateChaser(chaser, { x: 800, y: 100 }, 1, world);
  expect(chaser.position).toEqual(previous);
});
