import { expect, test } from '@playwright/test';
import { Container, Sprite, Texture } from 'pixi.js';
import { createExplosion, explosionConfig } from '../src/game/arena/explosions';
import { arenaScreenshot } from './helpers/arenaScreenshot';

test('explosions advance frames, fade, and preserve shared textures on cleanup', () => {
  const parent = new Container();
  const textures = Array.from(
    { length: 3 },
    () => new Texture({ source: Texture.EMPTY.source }),
  );
  const explosions = createExplosion(parent, textures);
  const layer = parent.children[0] as Container;
  explosions.play({ x: 120, y: 80 });
  const sprite = layer.children[0] as Sprite;
  expect(sprite.position.x).toBe(120);
  expect(sprite.position.y).toBe(80);
  expect(sprite.texture).toBe(textures[0]);
  explosions.update(0.25);
  expect(sprite.texture).toBe(textures[1]);
  expect(sprite.alpha).toBeCloseTo(1 - 0.25 / explosionConfig.duration);
  explosions.update(0.2);
  expect(sprite.texture).toBe(textures[2]);
  explosions.update(1);
  expect(layer.children).toHaveLength(0);
  explosions.play({ x: 0, y: 0 });
  const activeSprite = layer.children[0] as Sprite;
  explosions.destroy();
  expect(activeSprite.destroyed).toBe(true);
  expect(parent.children).toHaveLength(0);
  expect(textures.every((texture) => !texture.destroyed)).toBe(true);
});

test('explosion duration is the same at 30 and 60 FPS', () => {
  for (const fps of [30, 60]) {
    const parent = new Container();
    const explosions = createExplosion(parent, [Texture.EMPTY]);
    explosions.play({ x: 0, y: 0 });
    for (
      let frame = 0;
      frame < Math.round(fps * explosionConfig.duration);
      frame++
    ) {
      explosions.update(1 / fps);
    }
    expect((parent.children[0] as Container).children).toHaveLength(0);
    explosions.destroy();
  }
});

for (const cause of ['shot', 'contact'] as const) {
  test(`${cause} destruction renders one explosion that disappears`, async ({
    page,
  }, testInfo) => {
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.goto('/');
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByRole('status')).toHaveCount(0);
    await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
    if (cause === 'shot') {
      await page.keyboard.down('e');
      await page.clock.runFor(32);
      await page.keyboard.up('e');
      await page.clock.runFor(450);
    } else {
      await page.clock.runFor(2700);
    }
    await expect(
      page.getByText(`Score: ${cause === 'shot' ? 1 : 0}`, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(`Health: ${cause === 'shot' ? 5 : 4}/5`, { exact: true }),
    ).toBeVisible();
    const region =
      cause === 'shot'
        ? { x: 630, y: 210, width: 120, height: 120 }
        : { x: 535, y: 220, width: 100, height: 100 };
    const exploding = await arenaScreenshot(page, region);
    await page
      .locator('canvas')
      .screenshot({ path: testInfo.outputPath('explosion.png') });
    await page.clock.runFor(700);
    const finished = await arenaScreenshot(page, region);
    expect(exploding.equals(finished)).toBe(false);
    await page.clock.runFor(100);
    expect((await arenaScreenshot(page, region)).equals(finished)).toBe(true);
  });
}
