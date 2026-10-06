import { createChaserState } from '../mechanics/chaser';
import { createEnemy } from './enemies';
import type { EnemyOptions } from './types';

export function renderChaser({ ship, width, height, arena }: EnemyOptions) {
  const chaser = createChaserState({
    x: width * 0.75 - ship.width / 2,
    y: height / 2 - ship.height / 2,
    width: ship.width,
    height: ship.height,
  });
  chaser.position.heading = -Math.PI / 2;
  const chaserRenderer = createEnemy(arena, ship.texture, chaser, {
    position: chaser.position,
    tint: 0xffcc66,
  });
  return { chaser, chaserRenderer };
}
