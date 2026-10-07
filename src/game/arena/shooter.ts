import { createShooterState } from '../mechanics/shooter';
import type { PlayerState } from '../mechanics/simulation';
import { createEnemy } from './enemies';
import type { EnemyOptions, EnemyView } from './types';

export function renderShooter(
  { ship, width, height, arena, shipTextures, fire, healthBar }: EnemyOptions,
  position: PlayerState = {
    x: width * 0.85,
    y: height * 0.85,
    heading: Math.atan2(ship.x - width * 0.85, height * 0.85 - ship.y),
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
