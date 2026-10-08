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
  const ship = renderPlayer({
    texture: textures.playerShip.healthy,
    width,
    height,
  });
  const terrain = renderIsland({
    texture: textures.island,
    decorations: textures.decorations,
    width,
    height,
  });

  let island = terrain.island;
  const obstacles = terrain.obstacles;
  arena.addChild(water, island, ship);
  const enemyOptions = {
    healthBar: textures.enemyHealth,
    ship,
    width,
    height,
    arena,
    fire: textures.fire,
  };

  function spawnEnemy(kind: EnemyKind, position: PlayerState) {
    const enemy =
      kind === 'chaser'
        ? renderChaser(
            { ...enemyOptions, shipTextures: textures.chaser },
            position,
          )
        : renderShooter(
            { ...enemyOptions, shipTextures: textures.shooter },
            position,
          );
    view.enemies.push(enemy);
  }

  function resize(width: number, height: number) {
    replaceTerrain(width, height);
    water.width = width;
    water.height = height;
    Object.assign(view.size, { width, height });
  }

  function replaceTerrain(width: number, height: number) {
    const next = renderIsland({
      texture: textures.island,
      decorations: textures.decorations,
      width,
      height,
    });
    const layerIndex = arena.getChildIndex(island);
    arena.removeChild(island);
    island.destroy({ children: true });
    island = next.island;
    arena.addChildAt(island, layerIndex);
    obstacles.splice(0, obstacles.length, ...next.obstacles);
  }

  const view: ArenaView = {
    container: arena,
    size: { width, height },
    resize,
    ship,
    obstacles,
    projectileTexture: textures.projectile,
    explosionTextures: textures.explosion,
    playerShipTextures: textures.playerShip,
    playerHealthTextures: textures.playerHealth,
    fireTextures: textures.fire,
    enemies: [
      renderChaser({ ...enemyOptions, shipTextures: textures.chaser }),
      renderShooter({ ...enemyOptions, shipTextures: textures.shooter }),
    ],
    spawnEnemy,
  };
  return view;
}
