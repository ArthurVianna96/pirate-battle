import { expect, test } from '@playwright/test';
import { Container, Sprite, Texture, TextureSource } from 'pixi.js';
import { createPlayerHealthBar } from '../src/game/arena/player';

test('player health follows rotation above the hull, shrinks with damage and hides with the ship', () => {
  const arena = new Container();
  const ship = new Sprite({ texture: Texture.WHITE, anchor: 0.5 });
  ship.width = 66;
  ship.height = 113;
  ship.position.set(480, 270);
  arena.addChild(ship);
  const health = createPlayerHealthBar(arena, ship, {
    frame: new Texture({
      source: new TextureSource({ width: 160, height: 40 }),
    }),
    fill: new Texture({
      source: new TextureSource({ width: 160, height: 40 }),
    }),
  });

  health.sync(5, 5);
  const fullWidth = health.bar.children[2].getBounds().width;
  const uprightY = health.bar.y;
  ship.rotation = Math.PI / 2;
  ship.position.set(520, 300);
  health.sync(2, 5);
  expect(health.bar.rotation).toBe(0);
  expect(health.bar.x + health.bar.width / 2).toBeCloseTo(ship.x);
  expect(health.bar.y).toBeLessThan(ship.getBounds().minY);
  expect(health.bar.y).toBeGreaterThan(uprightY);
  expect(health.bar.children[2].getBounds().width).toBeCloseTo(
    (fullWidth * 2) / 5,
  );
  ship.visible = false;
  health.sync(0, 5);
  expect(health.bar.visible).toBe(false);
  health.destroy();
  expect(health.bar.destroyed).toBe(true);
  arena.destroy({ children: true });
  expect(Texture.WHITE.destroyed).toBe(false);
});
