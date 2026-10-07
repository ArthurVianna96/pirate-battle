import { expect, test } from '@playwright/test';

test('scenario selection persists and reset restores sample data', async ({
  page,
}) => {
  await page.goto('/?network=success&seed=0');
  await page.getByText('Network simulation', { exact: true }).click();
  await page.getByLabel('Scenario', { exact: true }).selectOption('empty');
  await expect(page.getByLabel('Scenario', { exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Ranking', exact: true }).click();
  await expect(
    page.getByText('No scores for this configuration yet.', { exact: true }),
  ).toBeVisible();
  await page.getByText('Network simulation', { exact: true }).click();
  await page.getByLabel('Scenario', { exact: true }).selectOption('many-pages');
  await expect(page.getByText('Page 1 of 6', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByText('Network simulation', { exact: true }).click();
  await expect(page.getByLabel('Scenario', { exact: true })).toHaveValue(
    'many-pages',
  );
  await page
    .getByRole('button', { name: 'Reset network state', exact: true })
    .click();
  await expect(page.getByLabel('Scenario', { exact: true })).toHaveValue(
    'success',
  );
  await page.getByRole('button', { name: 'Ranking', exact: true }).click();
  await expect(
    page.getByRole('cell', { name: 'Blackbeard', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Page 1 of 2', { exact: true })).toBeVisible();
});

test('tools stay hidden in the normal menu', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Network simulation', { exact: true }),
  ).toHaveCount(0);
});
