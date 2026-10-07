import { expect, test } from '@playwright/test';
import {
  advanceMatchClock,
  createMatchState,
  finishMatchIfNeeded,
  pauseMatch,
  resumeMatch,
} from '../src/game/mechanics/match';

test('pause freezes match time until explicit resume', () => {
  const match = createMatchState();
  advanceMatchClock(match, 1);
  expect(pauseMatch(match)).toBe(true);
  expect(pauseMatch(match)).toBe(false);
  expect(advanceMatchClock(match, 20)).toBe(0);
  expect(match.remainingSeconds).toBe(59);
  expect(resumeMatch(match)).toBe(true);
  expect(resumeMatch(match)).toBe(false);
  advanceMatchClock(match, 1);
  expect(match.remainingSeconds).toBe(58);
});

test('ended matches cannot pause or resume', () => {
  const match = createMatchState();
  finishMatchIfNeeded(match, 0);
  expect(pauseMatch(match)).toBe(false);
  expect(resumeMatch(match)).toBe(false);
});

test('match duration defaults to 60 and accepts only the supported range', () => {
  expect(createMatchState().remainingSeconds).toBe(60);
  expect(createMatchState(180).remainingSeconds).toBe(180);
  for (const duration of [59, 181, NaN, Infinity])
    expect(() => createMatchState(duration)).toThrow();
});

test('the final update simulates only the remaining fraction of a second', () => {
  const match = createMatchState();
  advanceMatchClock(match, 59.95);
  expect(advanceMatchClock(match, 0.1)).toBeCloseTo(0.05);
  expect(match.remainingSeconds).toBe(0);
  expect(finishMatchIfNeeded(match, 5)).toBe('time');
});

test('match duration agrees at 30 and 60 FPS', () => {
  for (const fps of [30, 60]) {
    const match = createMatchState();
    for (let frame = 0; frame < fps * 60; frame++)
      advanceMatchClock(match, 1 / fps);
    expect(match.remainingSeconds).toBe(0);
    expect(finishMatchIfNeeded(match, 5)).toBe('time');
  }
});

test('death ends the match once and freezes its clock', () => {
  const match = createMatchState();
  advanceMatchClock(match, 3);
  expect(finishMatchIfNeeded(match, 1)).toBeNull();
  expect(finishMatchIfNeeded(match, 0)).toBe('death');
  expect(finishMatchIfNeeded(match, 0)).toBeNull();
  expect(advanceMatchClock(match, 10)).toBe(0);
  expect(match.remainingSeconds).toBe(57);
});

test('time expiry freezes the clock and death wins a simultaneous ending', () => {
  const match = createMatchState();
  advanceMatchClock(match, 100);
  expect(finishMatchIfNeeded(match, 5)).toBe('time');
  expect(finishMatchIfNeeded(match, 0)).toBeNull();
  expect(match.endReason).toBe('time');
  expect(advanceMatchClock(match, 1)).toBe(0);
  const simultaneous = createMatchState();
  advanceMatchClock(simultaneous, 60);
  expect(finishMatchIfNeeded(simultaneous, 0)).toBe('death');
});

test('completion shows a frozen result and Play Again creates a fresh match', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByText('Time: 60s', { exact: true })).toBeVisible();
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await page.keyboard.down('e');
  await page.clock.runFor(32);
  await page.keyboard.up('e');
  await page.clock.runFor(1000);
  await expect(page.getByText('Time: 59s', { exact: true })).toBeVisible();
  await expect(page.getByText('Score: 1', { exact: true })).toBeVisible();
  await page.clock.runFor(9000);
  await expect(
    page.getByRole('region', { name: 'Match result' }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Ship destroyed.');
  await expect(page.locator('canvas')).toHaveCount(0);
  const playedTime = await page.getByText(/^Time played: /).textContent();
  for (const key of ['w', 'ArrowRight', 'q', 'e'])
    await page.keyboard.down(key);
  await page.clock.runFor(1000);
  for (const key of ['w', 'ArrowRight', 'q', 'e']) await page.keyboard.up(key);
  expect(await page.getByText(/^Time played: /).textContent()).toBe(playedTime);
  await expect(page.getByText('Score: 1', { exact: true })).toBeVisible();
  const playAgain = page.getByRole('button', {
    name: 'Play Again',
    exact: true,
  });
  await expect(playAgain).toBeFocused();
  await playAgain.press('Enter');
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByText('Time: 60s', { exact: true })).toBeVisible();
  await expect(page.getByText('Health: 5/5', { exact: true })).toBeVisible();
  await expect(page.getByText('Score: 0', { exact: true })).toBeVisible();
  await page.keyboard.down('e');
  await page.clock.runFor(32);
  await page.keyboard.up('e');
  await page.clock.runFor(700);
  await expect(page.getByText('Score: 1', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
