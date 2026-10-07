import { expect, test } from '@playwright/test';

test('portrait pauses play until rotation and explicit resume', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Rotation guidance applies to touch devices.');
  await page.setViewportSize({ width: 393, height: 839 });
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  const prompt = page.getByRole('dialog', { name: 'Rotate your phone' });
  await expect(prompt).toBeVisible();
  const remainingTime = await page.getByText(/^Time: /).textContent();
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await page.clock.runFor(5000);
  expect(await page.getByText(/^Time: /).textContent()).toBe(remainingTime);

  await page.setViewportSize({ width: 839, height: 393 });
  await expect(prompt).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Paused game' })).toBeVisible();
  await page.clock.runFor(1000);
  expect(await page.getByText(/^Time: /).textContent()).toBe(remainingTime);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.runFor(1000);
  expect(await page.getByText(/^Time: /).textContent()).not.toBe(remainingTime);

  await page.setViewportSize({ width: 393, height: 839 });
  await expect(prompt).toBeVisible();
  await page.getByRole('button', { name: 'Continue in portrait' }).click();
  await expect(page.getByRole('dialog', { name: 'Paused game' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
