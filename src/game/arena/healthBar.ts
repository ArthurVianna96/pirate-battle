import { Container, Graphics, Sprite } from 'pixi.js';
import type { HealthBarTextures } from './types';

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
  bar.scale.set(0.4);
  bar.position.set(-32, -shipHeight / 2 - 24);
  bar.addChild(frame, fill, mask);
  parent.addChild(bar);
  function update(fraction: number) {
    mask
      .clear()
      .rect(21, 9, 118 * Math.max(0, Math.min(1, fraction)), 21)
      .fill(0xffffff);
  }
  update(1);
  return { bar, update };
}
