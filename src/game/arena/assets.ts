import { Assets, type Texture } from 'pixi.js';
import projectileUrl from '../../../assets/png/default/ship_parts/cannon_ball.png';
import playerShipUrl from '../../../assets/png/default/ships/ship_1.png';
import islandTopLeftUrl from '../../../assets/png/default/tiles/tile_1.png';
import islandLeftUrl from '../../../assets/png/default/tiles/tile_17.png';
import islandCenterUrl from '../../../assets/png/default/tiles/tile_18.png';
import islandRightUrl from '../../../assets/png/default/tiles/tile_19.png';
import islandTopUrl from '../../../assets/png/default/tiles/tile_2.png';
import islandTopRightUrl from '../../../assets/png/default/tiles/tile_3.png';
import islandBottomLeftUrl from '../../../assets/png/default/tiles/tile_33.png';
import islandBottomUrl from '../../../assets/png/default/tiles/tile_34.png';
import islandBottomRightUrl from '../../../assets/png/default/tiles/tile_35.png';
import waterUrl from '../../../assets/png/default/tiles/tile_73.png';
import type { ArenaAssets } from './types';

const islandTileUrls = [
  islandTopLeftUrl,
  islandTopUrl,
  islandTopRightUrl,
  islandLeftUrl,
  islandCenterUrl,
  islandRightUrl,
  islandBottomLeftUrl,
  islandBottomUrl,
  islandBottomRightUrl,
];

export async function loadArenaAssets(): Promise<ArenaAssets> {
  const [playerShip, water, island, projectile] = await Promise.all([
    Assets.load<Texture>(playerShipUrl),
    Assets.load<Texture>(waterUrl),
    Promise.all(islandTileUrls.map((url) => Assets.load<Texture>(url))),
    Assets.load<Texture>(projectileUrl),
  ]);

  return { playerShip, water, island, projectile };
}
