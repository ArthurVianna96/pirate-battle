import { expect, test } from '@playwright/test';
import {
  advanceMatchClock,
  createMatchResult,
  createMatchState,
  finishMatchIfNeeded,
  pauseMatch,
  resumeMatch,
} from '../src/game/mechanics/match';

test('unfinished and abandoned matches have no completed result', () => {
  const match = createMatchState();
  advanceMatchClock(match, 5);
  expect(() => createMatchResult(match, 2)).toThrow();
});

test('death results contain score and active time, excluding paused time', () => {
  const match = createMatchState();
  advanceMatchClock(match, 1);
  pauseMatch(match);
  advanceMatchClock(match, 20);
  resumeMatch(match);
  advanceMatchClock(match, 2);
  finishMatchIfNeeded(match, 0);
  expect(createMatchResult(match, 4)).toEqual({
    score: 4,
    elapsedSeconds: 3,
    endReason: 'death',
  });
});

test('time expiry records the configured duration without frame overshoot', () => {
  const match = createMatchState(180);
  advanceMatchClock(match, 200);
  finishMatchIfNeeded(match, 5);
  expect(createMatchResult(match, 0)).toEqual({
    score: 0,
    elapsedSeconds: 180,
    endReason: 'time',
  });
});

test('the result renders and Main Menu restores keyboard focus', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await page.clock.runFor(10_000);
  const result = page.getByRole('region', { name: 'Match result' });
  await expect(result).toBeVisible();
  await expect(result.getByText('Score: 0', { exact: true })).toBeVisible();
  await expect(result.getByText(/^Time played: \d+\.\ds$/)).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page
    .locator('main')
    .screenshot({ path: testInfo.outputPath('result.png') });
  await result.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Main menu' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeFocused();
  await expect(result).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Last Result', exact: true }).click();
  await expect(result.getByText('Score: 0', { exact: true })).toBeVisible();
  await expect(
    result.getByText('Ship destroyed.', { exact: true }),
  ).toBeVisible();
});

test('abandoning a match preserves the previous result', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem(
      'pirate-battle.last-result',
      JSON.stringify({
        score: 7,
        elapsedSeconds: 60,
        endReason: 'time',
      }),
    );
  });
  await page.reload();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Last Result', exact: true }).click();
  await expect(page.getByText('Score: 7', { exact: true })).toBeVisible();
  await expect(page.getByText('Time expired.', { exact: true })).toBeVisible();
});

test('malformed saved results leave the menu usable', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem('pirate-battle.last-result', '{broken'),
  );
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Last Result', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
});
