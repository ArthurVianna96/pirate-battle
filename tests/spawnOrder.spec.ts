import { expect, test, type Page } from '@playwright/test';
import { arenaScreenshot } from './helpers/arenaScreenshot';

async function fireRight(page: Page) {
  await page.keyboard.down('e');
  await page.clock.runFor(32);
  await page.keyboard.up('e');
  await page.clock.runFor(650);
}

async function turn(page: Page, direction: 'ArrowRight' | 'ArrowLeft') {
  await page.keyboard.down(direction);
  await page.clock.runFor(660);
  await page.keyboard.up(direction);
}

test('recurring spawns include a Shooter that can damage the player', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));

  // Clear both initial enemies before the first recurring spawn.
  await fireRight(page);
  await turn(page, 'ArrowRight');
  await page.keyboard.down('Space');
  await page.clock.runFor(1650);
  await page.keyboard.up('Space');
  await expect(page.getByText('Score: 2', { exact: true })).toBeVisible();
  await turn(page, 'ArrowLeft');

  // The first recurring enemy is a Chaser; destroy it before the next spawn.
  await page.clock.runFor(700);
  await fireRight(page);
  await expect(page.getByText('Score: 3', { exact: true })).toBeVisible();
  await page.clock.runFor(650);
  const region = { x: 630, y: 210, width: 160, height: 120 };
  const empty = await arenaScreenshot(page, region);

  // The second recurring enemy is a Shooter and attacks from a distance.
  await page.clock.runFor(3000);
  expect((await arenaScreenshot(page, region)).equals(empty)).toBe(false);
  await page
    .locator('canvas')
    .screenshot({ path: testInfo.outputPath('spawned-shooter.png') });
  await page.clock.runFor(1000);
  await expect(page.getByText('Health: 4/5', { exact: true })).toBeVisible();
  await expect(page.getByText('Score: 3', { exact: true })).toBeVisible();
});
