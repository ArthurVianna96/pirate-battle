import enemyHealthFrameUrl from '../../../assets/png/default/ui/hud/enemy_health_frame.png';
import enemyHealthFillUrl from '../../../assets/png/default/ui/hud/enemy_health_fill_red.png';
import playerDamagedUrl from '../../../assets/png/default/ships/ship_7.png';
import playerCriticalUrl from '../../../assets/png/default/ships/ship_13.png';
import chaserUrl from '../../../assets/png/default/ships/ship_3.png';
import chaserDamagedUrl from '../../../assets/png/default/ships/ship_9.png';
import chaserCriticalUrl from '../../../assets/png/default/ships/ship_15.png';
import shooterUrl from '../../../assets/png/default/ships/ship_5.png';
import shooterDamagedUrl from '../../../assets/png/default/ships/ship_11.png';
import shooterCriticalUrl from '../../../assets/png/default/ships/ship_17.png';
import fire1Url from '../../../assets/png/default/effects/fire_1.png';
import fire2Url from '../../../assets/png/default/effects/fire_2.png';
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
import type { ArenaAssets, ShipTextures } from './types';
import explosion1Url from '../../../assets/png/default/effects/explosion_1.png';
import explosion2Url from '../../../assets/png/default/effects/explosion_2.png';
import explosion3Url from '../../../assets/png/default/effects/explosion_3.png';

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
  const [
    playerShip,
    water,
    island,
    projectile,
    explosion,
    chaser,
    shooter,
    fire,
    healthFrame,
    healthFill,
  ] = await Promise.all([
    loadShipTextures([playerShipUrl, playerDamagedUrl, playerCriticalUrl]),
    Assets.load<Texture>(waterUrl),
    Promise.all(islandTileUrls.map((url) => Assets.load<Texture>(url))),
    Assets.load<Texture>(projectileUrl),
    Promise.all(
      [explosion1Url, explosion2Url, explosion3Url].map((url) =>
        Assets.load<Texture>(url),
      ),
    ),
    loadShipTextures([chaserUrl, chaserDamagedUrl, chaserCriticalUrl]),
    loadShipTextures([shooterUrl, shooterDamagedUrl, shooterCriticalUrl]),
    Promise.all([fire1Url, fire2Url].map((url) => Assets.load<Texture>(url))),
    Assets.load<Texture>(enemyHealthFrameUrl),
    Assets.load<Texture>(enemyHealthFillUrl),
  ]);

  return {
    enemyHealth: { frame: healthFrame, fill: healthFill },
    playerShip,
    water,
    island,
    projectile,
    explosion,
    chaser,
    shooter,
    fire,
  };
}

async function loadShipTextures(
  urls: readonly [string, string, string],
): Promise<ShipTextures> {
  const [healthy, damaged, critical] = await Promise.all(
    urls.map((url) => Assets.load<Texture>(url)),
  );
  return { healthy, damaged, critical };
}
