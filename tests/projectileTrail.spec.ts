import { FRONT_WEAPON_CONFIG } from '../src/game/config';
import { expect, test } from '@playwright/test';
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import {
  createProjectile,
  PROJECTILE_TRAIL_CONFIG,
} from '../src/game/arena/projectiles';
import { createFrontProjectile } from '../src/game/mechanics/weapon';

test('trails grow from the muzzle, cap their length and disappear with the shot', () => {
  const parent = new Container();
  const renderer = createProjectile(parent, Texture.EMPTY);
  const shot = createFrontProjectile(
    1,
    { x: 100, y: 100, heading: Math.PI / 2 },
    FRONT_WEAPON_CONFIG,
  );
  const layer = parent.children[0] as Container;
  renderer.sync([shot]);
  const trail = (layer.children[0] as Container).children[0] as Graphics;
  const ball = layer.children[1] as Sprite;
  expect(trail.scale.x).toBe(0);
  shot.x += 80;
  renderer.sync([shot]);
  expect(trail.scale.x).toBe(80 / PROJECTILE_TRAIL_CONFIG.maxLength);
  expect(trail.rotation).toBeCloseTo(0);
  expect(trail.position.x).toBe(ball.position.x);
  shot.x += 300;
  renderer.sync([shot]);
  expect(trail.scale.x).toBe(1);
  renderer.sync([]);
  expect(trail.destroyed).toBe(true);
  expect(ball.destroyed).toBe(true);
  renderer.destroy();
  expect(parent.children).toHaveLength(0);
  expect(Texture.EMPTY.destroyed).toBe(false);
});

test('a shot first rendered after movement still starts its trail at the muzzle', () => {
  const parent = new Container();
  const renderer = createProjectile(parent, Texture.EMPTY);
  const shot = createFrontProjectile(
    1,
    { x: 100, y: 200, heading: 0 },
    FRONT_WEAPON_CONFIG,
  );
  shot.y += shot.velocityY * 0.1;
  renderer.sync([shot], 0.1);
  const layer = parent.children[0] as Container;
  const trail = (layer.children[0] as Container).children[0] as Graphics;
  expect(trail.scale.x).toBeCloseTo(32 / PROJECTILE_TRAIL_CONFIG.maxLength);
  expect(trail.rotation).toBeCloseTo(-Math.PI / 2);
  renderer.destroy();
});

test('side shots display three parallel trails', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await page.keyboard.down('e');
  await page.clock.runFor(32);
  await page.keyboard.up('e');
  await page.clock.runFor(250);
  await expect(page.getByText('Score: 0', { exact: true })).toBeVisible();
  await page
    .locator('canvas')
    .screenshot({ path: testInfo.outputPath('trails.png') });
});
