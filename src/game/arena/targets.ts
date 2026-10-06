import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { createTargetState, type TargetState } from '../mechanics/combat';
import type { TargetOptions } from './types';

const renderHealthBar = (group: Container, bounds: TargetState['bounds']) => {
  const background = new Graphics().rect(0, 0, 48, 6).fill(0x263238);
  const health = new Graphics().rect(0, 0, 48, 6).fill(0x66dd88);
  background.position.set(-24, -bounds.height / 2 - 12);
  health.position.copyFrom(background.position);
  group.addChild(background, health);
  return health;
};

export function createTarget(
  parent: Container,
  texture: Texture,
  target: TargetState,
) {
  const ship = new Sprite({ texture, anchor: 0.5, tint: 0xff8888 });
  const { bounds } = target;

  const group = new Container();
  group.position.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  group.addChild(ship);

  const health = renderHealthBar(group, bounds);
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

export const renderTarget = ({ ship, width, height, arena }: TargetOptions) => {
  const target = createTargetState({
    x: width * 0.75 - ship.width / 2,
    y: height / 2 - ship.height / 2,
    width: ship.width,
    height: ship.height,
  });

  const targetRenderer = createTarget(arena, ship.texture, target);
  return { target, targetRenderer };
};
