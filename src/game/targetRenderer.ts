import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { TargetState } from './target';

export function createTargetRenderer(
  parent: Container,
  texture: Texture,
  target: TargetState,
) {
  const group = new Container();
  const ship = new Sprite({ texture, anchor: 0.5, tint: 0xff8888 });
  const { bounds } = target;
  group.position.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  const background = new Graphics().rect(0, 0, 48, 6).fill(0x263238);
  const health = new Graphics().rect(0, 0, 48, 6).fill(0x66dd88);
  background.position.set(-24, -bounds.height / 2 - 12);
  health.position.copyFrom(background.position);
  group.addChild(ship, background, health);
  parent.addChild(group);

  return {
    sync() {
      if (group.destroyed) return;
      if (target.health === 0) {
        group.destroy({ children: true });
        return;
      }
      health.scale.x = target.health / target.maxHealth;
    },
    destroy() {
      if (!group.destroyed) group.destroy({ children: true });
    },
  };
}
