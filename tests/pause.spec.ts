import { expect, test, type Page } from '@playwright/test';
import { arenaScreenshot } from './helpers/arenaScreenshot';

async function startGame(page: Page) {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
}

test('pause freezes gameplay and resume requires fresh movement and firing input', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await startGame(page);
  const firingRegion = { x: 460, y: 0, width: 40, height: 160 };
  const emptyWater = await arenaScreenshot(page, firingRegion);
  await page.keyboard.down('w');
  await page.keyboard.down('Space');
  await page.clock.runFor(200);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Game paused. Select Resume to continue.',
  );
  const pausedTime = await page.getByText(/^Time: /).textContent();
  const pausedArena = await page.locator('canvas').screenshot();
  const shipRegion = { x: 430, y: 200, width: 100, height: 130 };
  const pausedShip = await arenaScreenshot(page, shipRegion);
  await page.clock.runFor(10_000);
  expect(await page.getByText(/^Time: /).textContent()).toBe(pausedTime);
  expect((await page.locator('canvas').screenshot()).equals(pausedArena)).toBe(
    true,
  );
  await expect(page.getByText('Health: 5/5', { exact: true })).toBeVisible();
  await expect(page.getByText('Score: 0', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  // A repeat from a key held before pausing must not restart movement.
  await page.keyboard.down('w');
  await page.clock.runFor(600);
  expect((await arenaScreenshot(page, shipRegion)).equals(pausedShip)).toBe(
    true,
  );
  expect((await arenaScreenshot(page, firingRegion)).equals(emptyWater)).toBe(
    true,
  );
  await page.keyboard.up('w');
  await page.keyboard.up('Space');
  await expect(page.getByText(/^Time: (59|60)s$/)).toBeVisible();
  await page.keyboard.down('w');
  await page.clock.runFor(200);
  await page.keyboard.up('w');
  expect((await arenaScreenshot(page, shipRegion)).equals(pausedShip)).toBe(
    false,
  );
});

for (const cause of ['blur', 'hidden'] as const) {
  test(`${cause} pauses and returning requires explicit resume`, async ({
    page,
  }) => {
    await startGame(page);
    const pausedTime = await page.getByText(/^Time: /).textContent();
    // Headless tabs remain focused. Dispatch browser lifecycle events directly.
    await page.evaluate((cause) => {
      if (cause === 'blur') window.dispatchEvent(new Event('blur'));
      else {
        Object.defineProperty(document, 'hidden', {
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      }
    }, cause);
    await expect(
      page.getByRole('button', { name: 'Resume', exact: true }),
    ).toBeVisible();
    await page.clock.runFor(5000);
    expect(await page.getByText(/^Time: /).textContent()).toBe(pausedTime);
    if (cause === 'hidden') {
      await page.getByRole('button', { name: 'Resume', exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'Resume', exact: true }),
      ).toBeVisible();
    }
    await page.evaluate(() => {
      Reflect.deleteProperty(document, 'hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('focus'));
    });
    await page.clock.runFor(2000);
    await expect(
      page.getByRole('button', { name: 'Resume', exact: true }),
    ).toBeVisible();
    expect(await page.getByText(/^Time: /).textContent()).toBe(pausedTime);
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.clock.runFor(1200);
    await expect(page.getByText('Time: 59s', { exact: true })).toBeVisible();
  });
}
