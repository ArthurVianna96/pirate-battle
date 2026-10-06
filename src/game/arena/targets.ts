import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { Obstacle } from '../collisions';
import type { TargetOptions } from './types';

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

export interface TargetState {
  bounds: Obstacle;
  health: number;
  maxHealth: number;
}

export function createTarget(bounds: Obstacle): TargetState {
  return { bounds, health: 3, maxHealth: 3 };
}

export function damageTarget(target: TargetState, damage: number) {
  target.health = Math.max(0, target.health - damage);
}

export const renderTarget = ({ ship, width, height, arena }: TargetOptions) => {
  const target = createTarget({
    x: width * 0.75 - ship.width / 2,
    y: height / 2 - ship.height / 2,
    width: ship.width,
    height: ship.height,
  });

  const targetRenderer = createTargetRenderer(arena, ship.texture, target);
  return { target, targetRenderer };
};
