import { expect, test } from '@playwright/test';

test('game audio starts after Play, fires once per shot and stops on pause and exit', async ({
  page,
}) => {
  const events: string[] = [];
  const sounds: string[] = [];
  page.on('console', (message) => {
    if (message.text().startsWith('audio:')) events.push(message.text());
  });
  page.on('request', (request) => {
    if (request.url().endsWith('.wav')) sounds.push(request.url());
  });
  await page.addInitScript(() => {
    class Source {
      loop = false;
      buffer = {};
      onended?: () => void;
      connect() {}
      disconnect() {}
      start() {
        console.log(`audio:start:${this.loop ? 'loop' : 'shot'}`);
      }
      stop() {
        console.log(`audio:stop:${this.loop ? 'loop' : 'shot'}`);
        this.onended?.();
      }
    }
    class Context {
      destination = {};
      async resume() {}
      async decodeAudioData() {
        return {};
      }
      createBufferSource() {
        return new Source();
      }
      createGain() {
        return { gain: { value: 0 }, connect() {}, disconnect() {} };
      }
    }
    Object.defineProperty(window, 'AudioContext', { value: Context });
  });
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  expect(events).toHaveLength(0);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect.poll(() => events.includes('audio:start:loop')).toBe(true);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await page.keyboard.down('Space');
  await page.clock.runFor(32);
  await page.keyboard.up('Space');
  await expect
    .poll(() => sounds.some((url) => url.includes('cannon_fire_1')))
    .toBe(true);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect.poll(() => events.includes('audio:stop:loop')).toBe(true);
  const loopStarts = events.filter(
    (event) => event === 'audio:start:loop',
  ).length;
  await page.clock.runFor(1000);
  expect(events.filter((event) => event === 'audio:start:loop')).toHaveLength(
    loopStarts,
  );
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect
    .poll(() => events.filter((event) => event === 'audio:start:loop').length)
    .toBe(loopStarts + 1);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('blocked audio does not prevent playing or pausing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', {
      value: class {
        constructor() {
          throw new Error('Audio blocked');
        }
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(errors).toEqual([]);
});
