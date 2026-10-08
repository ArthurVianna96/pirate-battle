import { expect, test } from '@playwright/test';

test('textures preload from the menu and slow loading stays visible', async ({
  page,
  context,
}) => {
  const soundRequests: string[] = [];
  context.on('request', (request) => {
    if (request.resourceType() !== 'script' && request.url().includes('.wav')) {
      soundRequests.push(request.url());
    }
  });
  let releaseAsset!: () => void;
  const assetBlocked = new Promise<void>((resolve) => {
    releaseAsset = resolve;
  });
  let markRequested!: () => void;
  const textureRequested = new Promise<void>((resolve) => {
    markRequested = resolve;
  });
  await context.route('**/tiles_vector.svg*', async (route) => {
    if (route.request().resourceType() === 'script') {
      await route.continue();
      return;
    }
    markRequested();
    await assetBlocked;
    await route.continue();
  });
  await page.goto('/');
  await textureRequested;
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole('status')).toContainText(
    'Loading game assets...',
  );
  await expect(page.getByRole('status')).toBeInViewport();
  await expect(page.getByRole('progressbar')).toBeVisible();
  await expect
    .poll(async () =>
      Number(await page.getByRole('progressbar').getAttribute('value')),
    )
    .toBeGreaterThan(0);
  expect(soundRequests).toEqual([]);
  await expect(page.locator('canvas')).toHaveCount(0);
  releaseAsset();
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('menu images finish before combat textures start', async ({
  page,
  context,
}) => {
  let releaseMenu!: () => void;
  const menuBlocked = new Promise<void>((resolve) => {
    releaseMenu = resolve;
  });
  const combatRequests: string[] = [];
  context.on('request', (request) => {
    if (
      request.resourceType() !== 'script' &&
      request.url().includes('tiles_vector.svg')
    ) {
      combatRequests.push(request.url());
    }
  });
  await context.route('**/button_secondary_pressed.png*', async (route) => {
    if (route.request().resourceType() === 'script') {
      await route.continue();
      return;
    }
    await menuBlocked;
    await route.continue();
  });
  await page.goto('/');
  await expect(page.getByRole('status')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Ranking', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: "Captain's Log" }),
  ).toBeVisible();
  expect(combatRequests).toEqual([]);
  releaseMenu();
  await page.getByRole('button', { name: 'Main Menu' }).click();
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeEnabled();
  expect(combatRequests.length).toBeGreaterThan(0);
});

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

for (const asset of ['ship_1.png', 'tiles_vector.svg']) {
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
    await expect(page.getByRole('alert')).toContainText(
      'Unable to load game assets',
    );
    await expect(page.locator('canvas')).toHaveCount(0);

    await context.unroute(`**/${asset}*`);
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.locator('canvas')).toHaveCount(1, { timeout: 15_000 });
    await expect(page.getByRole('status')).toHaveCount(0);
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
