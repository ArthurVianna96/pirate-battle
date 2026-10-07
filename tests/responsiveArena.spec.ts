import { expect, test } from '@playwright/test';

test('resizing preserves the arena proportions and the active match', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));

  const canvas = page.getByRole('img', { name: 'Naval battle arena' });
  const originalArena = await canvas.screenshot();
  const remainingTime = await page.getByText(/^Time: /).textContent();
  const originalSize = await canvas.evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    return { width: canvas.width, height: canvas.height };
  });

  for (const viewport of [
    { width: 393, height: 727 },
    { width: 727, height: 393 },
    { width: 1800, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(canvas).toHaveCSS('object-fit', 'contain');
    expect(await page.getByText(/^Time: /).textContent()).toBe(remainingTime);
    expect(
      await canvas.evaluate((element) => {
        const canvas = element as HTMLCanvasElement;
        return { width: canvas.width, height: canvas.height };
      }),
    ).toEqual(originalSize);

    for (const button of await page
      .locator('.game-controls button, .hud button')
      .all()) {
      const bounds = await button.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(viewport.width);
  }

  await page.setViewportSize(
    test.info().project.use.viewport ?? { width: 1280, height: 720 },
  );
  expect((await canvas.screenshot()).equals(originalArena)).toBe(true);
  await page.clock.runFor(1000);
  expect(await page.getByText(/^Time: /).textContent()).not.toBe(remainingTime);
});
