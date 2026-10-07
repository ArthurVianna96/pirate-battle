import { expect, test, type Page } from '@playwright/test';

async function completeMatch(page: Page) {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await page.clock.runFor(10_000);
  await expect(
    page.getByRole('region', { name: 'Match result' }),
  ).toBeVisible();
  await page.clock.resume();
}

test('completed matches update history and ranking and survive refresh', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await completeMatch(page);
  await expect(
    page.getByText('Match recorded.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page
    .getByRole('button', { name: 'Match History', exact: true })
    .click();
  await expect(
    page.getByRole('cell', { name: 'Defeated', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(2);
  await page.getByRole('tab', { name: 'Ranking', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.you-badge')).toBeVisible();
  await page.reload();
  await page
    .getByRole('button', { name: 'Match History', exact: true })
    .click();
  await expect(page.getByRole('row')).toHaveCount(2);
  await expect(
    page.getByRole('cell', { name: 'Defeated', exact: true }),
  ).toBeVisible();
});

test('failed registration can be retried with the original match ID', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    localStorage.setItem('test.registration-fail', 'true');
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (
        key === 'pirate-battle.mock-matches' &&
        localStorage.getItem('test.registration-fail')
      ) {
        throw new Error('Mock storage unavailable');
      }
      original.call(this, key, value);
    };
  });
  const submittedIds: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/matches')) {
      submittedIds.push(request.postDataJSON().id);
    }
  });
  await completeMatch(page);
  await expect(page.getByRole('alert')).toContainText(
    'Could not record this match.',
  );
  await expect(
    page.getByRole('button', { name: 'Play Again', exact: true }),
  ).toBeEnabled();
  await page.evaluate(() => localStorage.removeItem('test.registration-fail'));
  await page
    .getByRole('button', { name: 'Retry registration', exact: true })
    .click();
  await expect(
    page.getByText('Match recorded.', { exact: true }),
  ).toBeVisible();
  expect(submittedIds).toHaveLength(2);
  expect(submittedIds[1]).toBe(submittedIds[0]);
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page
    .getByRole('button', { name: 'Match History', exact: true })
    .click();
  await expect(page.getByRole('row')).toHaveCount(2);
});
