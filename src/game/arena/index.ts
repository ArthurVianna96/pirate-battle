import { Container, TilingSprite } from 'pixi.js';
import { renderIsland } from './island';
import { renderPlayer } from './player';
import type { ArenaAssets, ArenaView } from './types';
import { renderChaser } from './chaser';
import { renderShooter } from './shooter';
import type { PlayerState } from '../mechanics/simulation';
import type { EnemyKind } from '../mechanics/combat';

export { loadArenaAssets } from './assets';

export function createArena(
  textures: ArenaAssets,
  width: number,
  height: number,
): ArenaView {
  const arena = new Container();
  const water = new TilingSprite({ texture: textures.water, width, height });
  const ship = renderPlayer({ texture: textures.playerShip, width, height });
  const { island, obstacles } = renderIsland({
    texture: textures.island,
    width,
    height,
  });

  arena.addChild(water, island, ship);
  const enemyOptions = { ship, width, height, arena };

  function spawnEnemy(kind: EnemyKind, position: PlayerState) {
    const enemy =
      kind === 'chaser'
        ? renderChaser(enemyOptions, position)
        : renderShooter(enemyOptions, position);
    view.enemies.push(enemy);
  }

  const view: ArenaView = {
    container: arena,
    ship,
    obstacles,
    projectileTexture: textures.projectile,
    explosionTextures: textures.explosion,
    enemies: [renderChaser(enemyOptions), renderShooter(enemyOptions)],
    spawnEnemy,
  };
  return view;
}
