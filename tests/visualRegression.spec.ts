import { expect, test, type Page } from '@playwright/test';

async function waitForScreenAssets(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((image) => image.decode()),
    );
  });
}

test('menu, stable arena and completed match retain their appearance', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/?network=success&seed=0');
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await waitForScreenAssets(page);
  await expect(page.locator('main')).toHaveScreenshot('main-menu.png');

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.runFor(16);
  await waitForScreenAssets(page);
  await expect(page.locator('main')).toHaveScreenshot('stable-arena.png');

  await page.clock.runFor(15_000);
  await expect(
    page.getByRole('region', { name: 'Match result' }),
  ).toBeVisible();
  await page.clock.runFor(1000);
  await expect(
    page.getByText('Match recorded.', { exact: true }),
  ).toBeVisible();
  await waitForScreenAssets(page);
  await expect(page.locator('main')).toHaveScreenshot('match-result.png');
});
