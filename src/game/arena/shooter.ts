import { createShooterState } from '../mechanics/shooter';
import { SPAWN_CONFIG } from '../config';
import type { PlayerState } from '../mechanics/simulation';
import { createEnemy } from './enemies';
import type { EnemyOptions, EnemyView } from './types';

export function renderShooter(
  { ship, width, height, arena, shipTextures, fire, healthBar }: EnemyOptions,
  position: PlayerState = {
    x: width * SPAWN_CONFIG.initialShooter.x,
    y: height * SPAWN_CONFIG.initialShooter.y,
    heading: Math.atan2(
      ship.x - width * SPAWN_CONFIG.initialShooter.x,
      height * SPAWN_CONFIG.initialShooter.y - ship.y,
    ),
  },
): EnemyView {
  const shooter = createShooterState({
    x: position.x - ship.width / 2,
    y: position.y - ship.height / 2,
    width: ship.width,
    height: ship.height,
  });
  shooter.position.heading = position.heading;
  const renderer = createEnemy(arena, shipTextures.healthy, shooter, {
    healthBar,
    shipTextures,
    fire,
    position: shooter.position,
  });
  renderer.sync();
  return { kind: 'shooter', state: shooter, renderer };
}
