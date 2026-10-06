import { expect, test } from '@playwright/test';
import {
  createSpawnerState,
  updateSpawner,
  findEnemySpawn,
  takeNextEnemyKind,
} from '../src/game/mechanics/spawning';
import { createEnemyState } from '../src/game/mechanics/combat';
import { overlapsObstacle } from '../src/game/mechanics/collisions';
import { arenaScreenshot } from './helpers/arenaScreenshot';

const shipSize = { width: 66, height: 113 };
const arenaSize = { width: 960, height: 540 };
const player = { x: 480, y: 270 };

test('spawn order alternates and starts again for each match', () => {
  const spawner = createSpawnerState();
  expect(Array.from({ length: 4 }, () => takeNextEnemyKind(spawner))).toEqual([
    'chaser',
    'shooter',
    'chaser',
    'shooter',
  ]);
  expect(takeNextEnemyKind(createSpawnerState())).toBe('chaser');
});

test('spawns use active time and keep the remainder across updates', () => {
  const state = createSpawnerState();
  expect(updateSpawner(state, 3.9)).toBe(0);
  expect(updateSpawner(state, 0.1)).toBe(1);
  expect(updateSpawner(state, 9)).toBe(2);
  expect(state.elapsed).toBeCloseTo(1);
  expect(() => updateSpawner(state, 1, 0)).toThrow();
});

test('spawn counts agree at 30 and 60 FPS', () => {
  for (const fps of [30, 60]) {
    const state = createSpawnerState();
    let count = 0;
    for (let frame = 0; frame < fps * 12; frame++)
      count += updateSpawner(state, 1 / fps);
    expect(count).toBe(3);
    expect(state.elapsed).toBeCloseTo(0);
  }
});

test('spawn positions avoid the player, islands and living enemies', () => {
  const obstacle = { x: 650, y: 200, width: 140, height: 140 };
  const enemy = createEnemyState({ x: 760, y: 80, width: 130, height: 110 });
  const position = findEnemySpawn(
    player,
    { shipSize, arenaSize, obstacles: [obstacle] },
    [enemy],
  );
  expect(position).toBeDefined();
  expect(
    Math.hypot(position!.x - player.x, position!.y - player.y),
  ).toBeGreaterThanOrEqual(220);
  expect(overlapsObstacle(position!, shipSize, obstacle)).toBe(false);
  expect(overlapsObstacle(position!, shipSize, enemy.bounds)).toBe(false);
});

test('blocked arenas skip spawning', () => {
  expect(
    findEnemySpawn(
      player,
      { shipSize, arenaSize, obstacles: [{ x: 0, y: 0, ...arenaSize }] },
      [],
    ),
  ).toBeUndefined();
  expect(
    findEnemySpawn(
      player,
      { shipSize, arenaSize: { width: 100, height: 100 }, obstacles: [] },
      [],
    ),
  ).toBeUndefined();
});

test('a destroyed Chaser is replaced after four seconds and can be scored again', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await page.keyboard.down('e');
  await page.clock.runFor(32);
  await page.keyboard.up('e');
  await page.clock.runFor(1400);
  await expect(page.getByText('Score: 1', { exact: true })).toBeVisible();
  const region = { x: 630, y: 210, width: 160, height: 120 };
  const empty = await arenaScreenshot(page, region);
  await page.clock.runFor(2700);
  expect((await arenaScreenshot(page, region)).equals(empty)).toBe(false);
  await page.keyboard.down('e');
  await page.clock.runFor(32);
  await page.keyboard.up('e');
  await page.clock.runFor(600);
  await expect(page.getByText('Score: 2', { exact: true })).toBeVisible();
});
