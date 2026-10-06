import { createChaserState } from '../mechanics/chaser';
import { createEnemy } from './enemies';
import type { EnemyOptions, EnemyView } from './types';
import type { PlayerState } from '../mechanics/simulation';

export function renderChaser(
  { ship, width, height, arena }: EnemyOptions,
  position: PlayerState = {
    x: width * 0.75,
    y: height / 2,
    heading: -Math.PI / 2,
  },
): EnemyView {
  const chaser = createChaserState({
    x: position.x - ship.width / 2,
    y: position.y - ship.height / 2,
    width: ship.width,
    height: ship.height,
  });
  chaser.position.heading = position.heading;
  const chaserRenderer = createEnemy(arena, ship.texture, chaser, {
    position: chaser.position,
    tint: 0xffcc66,
  });
  return { kind: 'chaser', state: chaser, renderer: chaserRenderer };
}
