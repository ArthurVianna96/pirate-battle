import type { Page } from '@playwright/test';

export async function arenaScreenshot(
  page: Page,
  region = { x: 350, y: 0, width: 170, height: 350 },
) {
  await page.locator('canvas').scrollIntoViewIfNeeded();
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) {
    throw new Error('Arena canvas is missing.');
  }
  return page.screenshot({
    clip: {
      x: canvas.x + (region.x / 960) * canvas.width,
      y: canvas.y + (region.y / 540) * canvas.height,
      width: (region.width / 960) * canvas.width,
      height: (region.height / 540) * canvas.height,
    },
  });
}
