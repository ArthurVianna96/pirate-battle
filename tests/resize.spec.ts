import { expect, test } from '@playwright/test';
import { calculateArenaViewport } from '../src/game/arena/viewport';
import { relocateShip } from '../src/game/mechanics/resize';
import {
  getShipBounds,
  overlapsObstacle,
} from '../src/game/mechanics/collisions';

test('the playable world fills wide and portrait viewports without stretching', () => {
  for (const viewport of [
    { width: 839, height: 393 },
    { width: 393, height: 839 },
    { width: 1800, height: 1000 },
  ]) {
    const world = calculateArenaViewport(viewport);
    expect(world.width * world.scale).toBeCloseTo(viewport.width);
    expect(world.height * world.scale).toBeCloseTo(viewport.height);
    expect(world.width).toBeGreaterThanOrEqual(960);
    expect(world.height).toBeGreaterThanOrEqual(540);
  }
});

test('resize preserves ship state and relocates ships caught by land or arena edges', () => {
  const position = { x: 800, y: 400, heading: Math.PI / 2, health: 2 };
  const obstacle = { x: 550, y: 350, width: 200, height: 150 };
  const world = {
    arenaSize: { width: 960, height: 540 },
    shipSize: { width: 66, height: 113 },
    obstacles: [obstacle],
  };
  relocateShip(position, { width: 1200, height: 540 }, world);
  expect(position.health).toBe(2);
  expect(position.heading).toBe(Math.PI / 2);
  expect(overlapsObstacle(position, world.shipSize, obstacle)).toBe(false);
  const bounds = getShipBounds(position, world.shipSize);
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(960);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(540);
});
