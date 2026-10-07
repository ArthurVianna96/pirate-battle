import { expect, test } from '@playwright/test';

test('keyboard actions highlight the six HUD controls and reset on pause', async ({
  page,
}, testInfo) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  for (const [key, label] of [
    ['w', 'Move forward'],
    ['a', 'Turn left'],
    ['d', 'Turn right'],
    ['Space', 'Fire forward'],
    ['q', 'Fire left'],
    ['e', 'Fire right'],
  ]) {
    const button = page.getByRole('button', { name: label, exact: true });
    await page.keyboard.down(key);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.up(key);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  }
  await page.keyboard.down('w');
  await page.keyboard.down('ArrowUp');
  await page.keyboard.up('w');
  await expect(
    page.getByRole('button', { name: 'Move forward', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.down('Space');
  await page.screenshot({ path: testInfo.outputPath('controls.png') });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(
    page.locator('.game-controls button[aria-pressed="true"]'),
  ).toHaveCount(0);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('Space');
});

test('holding a HUD fire control shoots and releasing clears it', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  const fire = page.getByRole('button', { name: 'Fire right', exact: true });
  const bounds = (await fire.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await expect(fire).toHaveAttribute('aria-pressed', 'true');
  await page.clock.runFor(32);
  await page.mouse.move(10, 100);
  await page.mouse.up();
  await expect(fire).toHaveAttribute('aria-pressed', 'false');
  await page.clock.runFor(650);
  await expect(page.getByText('Score: 1', { exact: true })).toBeVisible();
});
