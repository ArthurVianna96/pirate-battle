import { expect, test } from '@playwright/test';

test('history paginates the local player records and refreshes on reopening', async ({
  page,
}, testInfo) => {
  if (testInfo.project.name === 'chromium') {
    await page.setViewportSize({ width: 1800, height: 1000 });
  }
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const player = JSON.parse(localStorage.getItem('pirate-battle.player')!);
    for (let index = 0; index < 6; index++) {
      await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `history-${index}`,
          player,
          score: index,
          completedAt: `2026-01-0${index + 1}T12:00:00.000Z`,
          elapsedSeconds: 60,
          endReason: 'time',
          configuration: { sessionDuration: 60, enemySpawnInterval: 4 },
        }),
      });
    }
  });
  await page.getByRole('button', { name: 'Match History' }).click();
  await expect(page.getByText('Page 1 of 2', { exact: true })).toBeVisible();
  await page
    .locator('main')
    .screenshot({ path: testInfo.outputPath('history.png') });
  await expect(page.getByRole('cell', { name: /^06 JAN/ })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('cell', { name: /^01 JAN/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Ranking', exact: true }).click();
  await page.getByRole('tab', { name: 'Match History' }).click();
  await expect(page.getByText('Page 1 of 2', { exact: true })).toBeVisible();
});

test('ranking pages and keyboard tabs remain accessible', async ({
  page,
}, testInfo) => {
  if (testInfo.project.name === 'chromium') {
    await page.setViewportSize({ width: 1800, height: 1000 });
  }
  await page.goto('/');
  await page
    .locator('main')
    .screenshot({ path: testInfo.outputPath('menu.png') });
  await page.getByRole('button', { name: 'Ranking', exact: true }).click();
  await expect(
    page.getByRole('cell', { name: 'Blackbeard', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Page 1 of 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(
    page.getByRole('cell', { name: 'Grace O’Malley', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Page 2 of 2', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Next', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(
    page.getByRole('cell', { name: 'Blackbeard', exact: true }),
  ).toBeVisible();
  await page
    .locator('main')
    .screenshot({ path: testInfo.outputPath('ranking.png') });
  await page.getByRole('tab', { name: 'Ranking', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Match History' })).toBeFocused();
  await expect(
    page.getByText('No recorded matches yet.', { exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Home');
  await expect(
    page.getByRole('tab', { name: 'Ranking', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expect(
    page.getByText('Navigate the islands. Survive the battle.', {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test('ranking loading and failure allow retry without blocking Play', async ({
  page,
  context,
}) => {
  await context.route('**/mockServiceWorker.js', (route) => route.abort());
  let fail = true;
  await context.route('**/api/ranking?*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({
      status: fail ? 400 : 200,
      contentType: 'application/json',
      body: JSON.stringify(
        fail
          ? { code: 'TEST_ERROR', message: 'Unavailable' }
          : { items: [], totalItems: 0, page: 1, pageSize: 5 },
      ),
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Ranking', exact: true }).click();
  await expect(
    page.getByText('Loading records…', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(
    'Could not load records.',
  );
  await expect(
    page.getByRole('button', { name: 'Main Menu', exact: true }),
  ).toBeEnabled();
  fail = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(
    page.getByText('No scores for this configuration yet.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
