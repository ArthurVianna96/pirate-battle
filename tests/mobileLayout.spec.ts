import { expect, test, type Locator } from '@playwright/test';

async function expectInsideScreen(
  element: Locator,
  width: number,
  height: number,
) {
  const bounds = await element.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
}

for (const viewport of [
  { width: 393, height: 839 },
  { width: 839, height: 393 },
  { width: 956, height: 440 },
]) {
  test(`menus fit ${viewport.width}x${viewport.height}`, async ({
    page,
    isMobile,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('.controls-help')).toBeVisible();
    await expectInsideScreen(
      page.locator('.main-menu'),
      viewport.width,
      viewport.height,
    );
    await page.getByRole('button', { name: 'Ranking', exact: true }).click();
    await expect(page.locator('.ranking-table')).toBeVisible();
    await expectInsideScreen(
      page.locator('.captains-log'),
      viewport.width,
      viewport.height,
    );
    await expectInsideScreen(
      page.locator('.pagination'),
      viewport.width,
      viewport.height,
    );
    await page.getByRole('tab', { name: 'Match History' }).click();
    await expectInsideScreen(
      page.locator('.captains-log'),
      viewport.width,
      viewport.height,
    );
    await expectInsideScreen(
      page.getByRole('button', { name: 'Main Menu', exact: true }),
      viewport.width,
      viewport.height,
    );
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.locator('canvas')).toBeVisible();
    const rotation = page.getByRole('dialog', { name: 'Rotate your phone' });
    if (isMobile && viewport.height > viewport.width) {
      await expect(rotation).toBeVisible();
      await page.getByRole('button', { name: 'Continue in portrait' }).click();
    } else {
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
    }
    await expectInsideScreen(
      page.locator('.pause-menu'),
      viewport.width,
      viewport.height,
    );
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await expectInsideScreen(
      page.locator('.options-screen'),
      viewport.width,
      viewport.height,
    );
    await expect(page.locator('.arena')).toHaveCSS(
      'background-image',
      /tile_73/,
    );
  });
}
