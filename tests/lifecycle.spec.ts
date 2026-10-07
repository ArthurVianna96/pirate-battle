import { expect, test } from '@playwright/test';

test('entering and leaving creates a single canvas without errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  await page.goto('/');

  for (let cycle = 0; cycle < 5; cycle++) {
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.getByRole('status')).toHaveCount(0);
    const bounds = await page.locator('canvas').boundingBox();
    expect(bounds?.width).toBeGreaterThan(0);
    expect(bounds?.height).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Main Menu' }).click();
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Play', exact: true }),
    ).toBeFocused();
  }

  expect(errors).toEqual([]);
});

for (const asset of ['ship_1.png', 'tile_73.png']) {
  test(`${asset} loading failure can be retried`, async ({
    page,
    context,
  }, testInfo) => {
    await context.route(`**/${asset}*`, (route) =>
      route.request().resourceType() === 'script'
        ? route.continue()
        : route.abort(),
    );
    await page.goto('/');
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(
      'Unable to load game assets',
    );
    await expect(page.locator('canvas')).toHaveCount(0);

    await context.unroute(`**/${asset}*`);
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.locator('canvas')).toHaveCount(1);
    await page
      .locator('canvas')
      .screenshot({ path: testInfo.outputPath('arena.png') });
  });
}

test('leaving soon after entry allows a fresh entry', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Main Menu' }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveCount(0);
  expect(errors).toEqual([]);
});
