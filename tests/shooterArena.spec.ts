import { expect, test, type Page } from '@playwright/test';
import { arenaScreenshot } from './helpers/arenaScreenshot';

async function startWithoutChaser(page: Page) {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await page.keyboard.down('e');
  await page.clock.runFor(32);
  await page.keyboard.up('e');
  await page.clock.runFor(650);
  await expect(page.getByText('Score: 1', { exact: true })).toBeVisible();
}

test.use({ viewport: { width: 960, height: 540 } });

test('the Shooter approaches, renders its shot and damages the player', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  await startWithoutChaser(page);
  const region = { x: 600, y: 310, width: 300, height: 200 };
  const before = await arenaScreenshot(page, region);
  await page.clock.runFor(1000);
  expect((await arenaScreenshot(page, region)).equals(before)).toBe(false);
  await page.clock.runFor(2700);
  const firingRegion = { x: 540, y: 290, width: 100, height: 80 };
  const firing = await arenaScreenshot(page, firingRegion);
  await page.clock.runFor(600);
  expect((await arenaScreenshot(page, firingRegion)).equals(firing)).toBe(
    false,
  );
  await expect(page.getByText('Health: 4/5', { exact: true })).toBeVisible();
  await expect(page.getByText('Score: 1', { exact: true })).toBeVisible();
  await page
    .locator('canvas')
    .screenshot({ path: testInfo.outputPath('shooter.png') });
});

test('keyboard shots destroy the Shooter and award one additional point', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await startWithoutChaser(page);
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(660);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('Space');
  await page.clock.runFor(1650);
  await page.keyboard.up('Space');
  await expect(page.getByText('Score: 2', { exact: true })).toBeVisible();
  await expect(page.getByText('Health: 5/5', { exact: true })).toBeVisible();
  await page.clock.runFor(300);
  await expect(page.getByText('Score: 2', { exact: true })).toBeVisible();
});
