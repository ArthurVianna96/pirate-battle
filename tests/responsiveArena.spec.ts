import { expect, test } from '@playwright/test';

test('resizing fills the viewport and preserves the active match', async ({
  page,
  isMobile,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));

  const canvas = page.getByRole('img', { name: 'Naval battle arena' });
  const remainingTime = await page.getByText(/^Time: /).textContent();

  for (const viewport of [
    { width: 393, height: 727 },
    { width: 727, height: 393 },
    { width: 1800, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    const rotationPrompt = page.getByRole('dialog', {
      name: 'Rotate your phone',
    });
    if (isMobile && viewport.height > viewport.width) {
      await expect(rotationPrompt).toBeVisible();
      await page.getByRole('button', { name: 'Continue in portrait' }).click();
      await page.getByRole('button', { name: 'Resume', exact: true }).click();
    }
    await expect(rotationPrompt).toHaveCount(0);
    await expect
      .poll(async () =>
        canvas.evaluate((element) => {
          const canvas = element as HTMLCanvasElement;
          return { width: canvas.width, height: canvas.height };
        }),
      )
      .toEqual({
        width: Math.round(
          viewport.width * (await page.evaluate(() => devicePixelRatio)),
        ),
        height: Math.round(
          viewport.height * (await page.evaluate(() => devicePixelRatio)),
        ),
      });
    expect(await page.getByText(/^Time: /).textContent()).toBe(remainingTime);

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
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.clock.runFor(1000);
  expect(await page.getByText(/^Time: /).textContent()).not.toBe(remainingTime);
});
