import { expect, test } from '@playwright/test';
import {
  createOptionsSnapshot,
  isDurationValid,
  isSpawnIntervalValid,
  parseOptions,
} from '../src/game/support/options';
import { OPTIONS_STORAGE_KEY } from '../src/storage/options';

test('options accept whole seconds within their limits', () => {
  for (const value of [60, 90, 180]) {
    expect(isDurationValid(value)).toBe(true);
  }
  for (const value of [1, 2, 30]) {
    expect(isSpawnIntervalValid(value)).toBe(true);
  }
  for (const value of [null, '', '60', NaN, 59, 181, 60.5]) {
    expect(isDurationValid(value)).toBe(false);
  }
  for (const value of [null, '', '1', NaN, 0, 31, 1.5]) {
    expect(isSpawnIntervalValid(value)).toBe(false);
  }
  for (const value of [null, {}, { sessionDuration: 60 }]) {
    expect(parseOptions(value)).toBeNull();
  }
});

test('each match receives a validated, independent options snapshot', () => {
  const options = { sessionDuration: 90, enemySpawnInterval: 2 };
  const snapshot = createOptionsSnapshot(options);
  options.sessionDuration = 120;
  options.enemySpawnInterval = 30;
  expect(snapshot).toEqual({ sessionDuration: 90, enemySpawnInterval: 2 });
  expect(Object.isFrozen(snapshot)).toBe(true);
  expect(() =>
    createOptionsSnapshot({ ...options, sessionDuration: 0 }),
  ).toThrow();
});

test('invalid fields stay editable until both values are valid', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  const duration = page.getByLabel('Game session time', { exact: true });
  const spawn = page.getByLabel('Enemy spawn time', { exact: true });
  await duration.fill('59');
  await spawn.fill('0');
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(2);
  await expect(duration).toBeFocused();
  await duration.fill('90');
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expect(spawn).toBeFocused();
  await spawn.fill('2');
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(duration).toHaveValue('90');
  await expect(spawn).toHaveValue('2');
});

test('saved options survive reload and control new matches', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByLabel('Game session time', { exact: true }).fill('90');
  await page.getByLabel('Enemy spawn time', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(
    page.getByLabel('Game session time', { exact: true }),
  ).toHaveValue('90');
  await expect(
    page.getByLabel('Enemy spawn time', { exact: true }),
  ).toHaveValue('2');
  await page
    .locator('main')
    .screenshot({ path: testInfo.outputPath('options.png') });
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByText('Time: 90s', { exact: true })).toBeVisible();
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await page
    .locator('main')
    .screenshot({ path: testInfo.outputPath('hud.png') });
  await page.keyboard.down('e');
  await page.clock.runFor(32);
  await page.keyboard.up('e');
  await page.clock.runFor(650);
  await expect(page.getByText('Score: 1', { exact: true })).toBeVisible();
  await page.clock.runFor(1600);
  await page.keyboard.down('e');
  await page.clock.runFor(32);
  await page.keyboard.up('e');
  await page.clock.runFor(650);
  await expect(page.getByText('Score: 2', { exact: true })).toBeVisible();
});

test('corrupt stored options fall back to defaults', async ({ page }) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, '{broken'),
    OPTIONS_STORAGE_KEY,
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(
    page.getByLabel('Game session time', { exact: true }),
  ).toHaveValue('60');
  await expect(
    page.getByLabel('Enemy spawn time', { exact: true }),
  ).toHaveValue('4');
});

test('storage failure keeps the form open with an error', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable');
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Unable to save options. Try again.',
  );
  await expect(
    page.getByRole('region', { name: 'Options', exact: true }),
  ).toBeVisible();
});

test('round buttons adjust seconds and respect the limits', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(
    page.getByRole('button', {
      name: 'Decrease game session time',
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Increase game session time', exact: true })
    .click();
  await expect(
    page.getByLabel('Game session time', { exact: true }),
  ).toHaveValue('61');
  await page
    .getByRole('button', { name: 'Decrease enemy spawn time', exact: true })
    .click();
  await expect(
    page.getByLabel('Enemy spawn time', { exact: true }),
  ).toHaveValue('3');
  await page.getByLabel('Enemy spawn time', { exact: true }).fill('30');
  await expect(
    page.getByRole('button', {
      name: 'Increase enemy spawn time',
      exact: true,
    }),
  ).toBeDisabled();
});
