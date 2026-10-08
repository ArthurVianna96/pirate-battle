import { expect, test } from '@playwright/test';
import { Container, Sprite, Texture } from 'pixi.js';
import { createShipAppearance } from '../src/game/arena/shipAppearance';
import { createCombatEffects } from '../src/game/arena/combatEffects';

test.use({ viewport: { width: 960, height: 540 } });

test('damage flashes, replaces the damaged sail and animates fire without resizing collisions', () => {
  const parent = new Container();
  const normal = new Texture({ source: Texture.EMPTY.source });
  const damaged = new Texture({ source: Texture.EMPTY.source });
  const critical = new Texture({ source: Texture.EMPTY.source });
  const flames = [
    new Texture({ source: Texture.EMPTY.source }),
    new Texture({ source: Texture.EMPTY.source }),
  ];
  const ship = new Sprite({ texture: normal, tint: 0x88bbff });
  ship.width = 66;
  ship.height = 113;
  parent.addChild(ship);
  const appearance = createShipAppearance(
    parent,
    ship,
    { healthy: normal, damaged, critical },
    flames,
  );
  const fire = parent.children[1] as Sprite;
  appearance.update(3, 3, 0);
  expect(fire.visible).toBe(false);
  appearance.update(2, 3, 0);
  expect(ship.texture).toBe(damaged);
  expect(fire.visible).toBe(false);
  appearance.update(1, 3, 0);
  expect(ship.texture).toBe(critical);
  expect(ship.tint).toBe(0xff6655);
  expect(fire.visible).toBe(true);
  appearance.update(1, 3, 0.12);
  expect(fire.texture).toBe(flames[1]);
  appearance.update(1, 3, 0.12);
  expect(ship.tint).toBe(0x88bbff);
  expect(ship.width).toBe(66);
  expect(ship.height).toBe(113);
  appearance.destroy();
  expect(fire.destroyed).toBe(true);
  expect(damaged.destroyed).toBe(false);
  parent.destroy({ children: true });
});

test('shot and impact effects fade, expire and release sprites', () => {
  const parent = new Container();
  const effects = createCombatEffects(parent, Texture.EMPTY);
  const layer = parent.children[0] as Container;
  effects.shot({ x: 10, y: 20 });
  effects.impact({ x: 20, y: 30 });
  expect(layer.children).toHaveLength(2);
  effects.update(0.1);
  expect(layer.children[0].alpha).toBeLessThan(1);
  effects.update(0.1);
  expect(layer.children).toHaveLength(1);
  effects.update(0.1);
  expect(layer.children).toHaveLength(0);
  effects.destroy();
  expect(parent.children).toHaveLength(0);
});

test('front shots show a muzzle flash and sustained damage changes the player ship', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.pauseAt(new Date('2026-01-01T00:00:10Z'));
  await page.keyboard.down('Space');
  await page.clock.runFor(32);
  await page.keyboard.up('Space');
  await page
    .locator('canvas')
    .screenshot({ path: testInfo.outputPath('muzzle.png') });
  await page.clock.runFor(6000);
  await expect(page.getByText(/^Health: [12]\/5$/)).toBeVisible();
  await page
    .locator('canvas')
    .screenshot({ path: testInfo.outputPath('damaged.png') });
});
