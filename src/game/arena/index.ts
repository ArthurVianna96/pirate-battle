import { Container, TilingSprite } from 'pixi.js';
import { renderIsland } from './island';
import { renderShip } from './ship';
import type { ArenaAssets, ArenaView } from './types';
import { renderChaser } from './chaser';

export { loadArenaAssets } from './assets';

export function createArena(
  textures: ArenaAssets,
  width: number,
  height: number,
): ArenaView {
  const arena = new Container();
  const water = new TilingSprite({ texture: textures.water, width, height });
  const ship = renderShip({ texture: textures.playerShip, width, height });
  const { island, obstacles } = renderIsland({
    texture: textures.island,
    width,
    height,
  });

  arena.addChild(water, island, ship);
  const { chaser, chaserRenderer } = renderChaser({
    ship,
    width,
    height,
    arena,
  });

  return {
    container: arena,
    ship,
    obstacles,
    projectileTexture: textures.projectile,
    chaser,
    chaserRenderer,
  };
}
