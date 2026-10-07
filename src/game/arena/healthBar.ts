import { Container, Graphics, Sprite } from 'pixi.js';
import type { HealthBarTextures } from './types';

export const HEALTH_BAR_CONFIG = {
  scale: 0.4,
  width: 160,
  height: 40,
  gap: 8,
  fill: { x: 21, y: 9, width: 118, height: 21 },
} as const;

export function createHealthBar(
  parent: Container,
  shipHeight: number,
  textures: HealthBarTextures,
) {
  const bar = new Container();
  const frame = new Sprite({ texture: textures.frame });
  const fill = new Sprite({ texture: textures.fill });
  const mask = new Graphics();
  fill.mask = mask;
  const { scale, width, height, gap } = HEALTH_BAR_CONFIG;
  bar.scale.set(scale);
  bar.position.set(
    (-width * scale) / 2,
    -shipHeight / 2 - height * scale - gap,
  );
  bar.addChild(frame, fill, mask);
  parent.addChild(bar);
  function update(fraction: number) {
    const { x, y, width, height } = HEALTH_BAR_CONFIG.fill;
    const remaining = Math.max(0, Math.min(1, fraction));
    mask
      .clear()
      .rect(x, y, width * remaining, height)
      .fill(0xffffff);
  }
  update(1);
  return { bar, update };
}
