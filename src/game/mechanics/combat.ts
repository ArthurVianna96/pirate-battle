import type { Obstacle } from './collisions';

export interface TargetState {
  bounds: Obstacle;
  health: number;
  maxHealth: number;
}

export function createTargetState(bounds: Obstacle): TargetState {
  return { bounds, health: 3, maxHealth: 3 };
}

export function damageTarget(target: TargetState, damage: number) {
  target.health = Math.max(0, target.health - damage);
}
