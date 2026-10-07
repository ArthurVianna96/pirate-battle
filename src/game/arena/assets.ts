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
  const [ships, scenery, effects, enemyHealth] = await Promise.all([
    loadShips(),
    loadScenery(),
    loadEffects(),
    loadEnemyHealth(),
  ]);
  return { ...ships, ...scenery, ...effects, enemyHealth };
}

async function loadShips() {
  const [playerShip, chaser, shooter] = await Promise.all([
    loadShipTextures([playerShipUrl, playerDamagedUrl, playerCriticalUrl]),
    loadShipTextures([chaserUrl, chaserDamagedUrl, chaserCriticalUrl]),
    loadShipTextures([shooterUrl, shooterDamagedUrl, shooterCriticalUrl]),
  ]);
  return { playerShip, chaser, shooter };
}

async function loadScenery() {
  const [water, island] = await Promise.all([
    Assets.load<Texture>(waterUrl),
    loadTextures(islandTileUrls),
  ]);
  return { water, island };
}

async function loadEffects() {
  const [projectile, explosion, fire] = await Promise.all([
    Assets.load<Texture>(projectileUrl),
    loadTextures([explosion1Url, explosion2Url, explosion3Url]),
    loadTextures([fire1Url, fire2Url]),
  ]);
  return { projectile, explosion, fire };
}

async function loadEnemyHealth() {
  const [frame, fill] = await loadTextures([
    enemyHealthFrameUrl,
    enemyHealthFillUrl,
  ]);
  return { frame, fill };
}

function loadTextures(urls: readonly string[]) {
  return Promise.all(urls.map((url) => Assets.load<Texture>(url)));
}

async function loadShipTextures(
  urls: readonly [string, string, string],
): Promise<ShipTextures> {
  const [healthy, damaged, critical] = await loadTextures(urls);
  return { healthy, damaged, critical };
}
