import { expect, test } from '@playwright/test';
import { advancePlayer, overlapsObstacle } from '../src/game/collisions';
import { movementConfig } from '../src/game/simulation';

const obstacle = { x: 144, y: 174, width: 192, height: 192 };
const world = {
  shipSize: { width: 64, height: 112 },
  arenaSize: { width: 960, height: 540 },
  obstacles: [obstacle],
};

test('the island blocks approaches from every side, including a long frame', () => {
  const approaches = [
    { x: 480, y: 270, heading: -Math.PI / 2, expectedX: 392, expectedY: 270 },
    { x: 64, y: 270, heading: Math.PI / 2, expectedX: 88, expectedY: 270 },
    { x: 240, y: 80, heading: Math.PI, expectedX: 240, expectedY: 118 },
    { x: 240, y: 480, heading: 0, expectedX: 240, expectedY: 422 },
  ];
  for (const initial of approaches) {
    const player = { ...initial };
    advancePlayer(
      player,
      { forward: true, turnLeft: false, turnRight: false },
      3,
      movementConfig,
      world,
    );
    expect(overlapsObstacle(player, world.shipSize, obstacle)).toBe(false);
    expect(player.x).toBeCloseTo(initial.expectedX);
    expect(player.y).toBeCloseTo(initial.expectedY);
    const atContact = { ...player };
    advancePlayer(
      player,
      { forward: true, turnLeft: false, turnRight: false },
      1,
      movementConfig,
      world,
    );
    expect(player.x).toBeCloseTo(atContact.x);
    expect(player.y).toBeCloseTo(atContact.y);
  }
});

test('rotation at contact remains possible without overlapping the island', () => {
  const player = { x: 392, y: 270, heading: -Math.PI / 2 };
  advancePlayer(
    player,
    { forward: false, turnLeft: false, turnRight: true },
    1,
    movementConfig,
    world,
  );
  expect(player.heading).toBeCloseTo(Math.PI / 2);
  expect(overlapsObstacle(player, world.shipSize, obstacle)).toBe(false);
});

test('keyboard navigation renders movement and turning near the island', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await page.keyboard.down('a');
  await page.clock.runFor(500);
  await page.keyboard.up('a');
  const before = await page.locator('canvas').screenshot();
  await page.keyboard.down('w');
  await page.clock.runFor(2000);
  await page.keyboard.up('w');
  await page.clock.runFor(50);
  const contact = await page.locator('canvas').screenshot();
  expect(contact.equals(before)).toBe(false);
  await page.keyboard.down('d');
  await page.clock.runFor(1000);
  await page.keyboard.up('d');
  await page.keyboard.down('w');
  await page.clock.runFor(500);
  await page.keyboard.up('w');
  expect((await page.locator('canvas').screenshot()).equals(contact)).toBe(
    false,
  );
});
