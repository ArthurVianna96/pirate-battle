import { createChaserState } from '../mechanics/chaser';
import { SPAWN_CONFIG } from '../config';
import { createEnemy } from './enemies';
import type { EnemyOptions, EnemyView } from './types';
import type { PlayerState } from '../mechanics/simulation';

export function renderChaser(
  { ship, width, height, arena, shipTextures, fire, healthBar }: EnemyOptions,
  position: PlayerState = {
    x: width * SPAWN_CONFIG.initialChaser.x,
    y: height * SPAWN_CONFIG.initialChaser.y,
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
  const chaserRenderer = createEnemy(arena, shipTextures.healthy, chaser, {
    healthBar,
    shipTextures,
    fire,
    position: chaser.position,
  });
  return { kind: 'chaser', state: chaser, renderer: chaserRenderer };
}
