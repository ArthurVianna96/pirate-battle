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
  const scale = Math.min(canvas.width / 960, canvas.height / 540);
  const arenaLeft = canvas.x + canvas.width / 2 - 480 * scale;
  const arenaTop = canvas.y + canvas.height / 2 - 270 * scale;
  return page.screenshot({
    clip: {
      x: arenaLeft + region.x * scale,
      y: arenaTop + region.y * scale,
      width: region.width * scale,
      height: region.height * scale,
    },
  });
}
