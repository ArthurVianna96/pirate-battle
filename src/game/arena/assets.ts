import enemyHealthFrameUrl from '../../../assets/png/default/ui/hud/enemy_health_frame.png';
import enemyHealthFillUrl from '../../../assets/png/default/ui/hud/enemy_health_fill_red.png';
import playerHealthFillUrl from '../../../assets/png/default/ui/hud/enemy_health_fill_green.png';
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
import { Assets, Rectangle, Texture } from 'pixi.js';
import projectileUrl from '../../../assets/png/default/ship_parts/cannon_ball.png';
import playerShipUrl from '../../../assets/png/default/ships/ship_1.png';
import terrainSheetUrl from '../../../assets/vector/tiles_vector.svg';
import type { ArenaAssets, IslandTextures, ShipTextures } from './types';
import explosion1Url from '../../../assets/png/default/effects/explosion_1.png';
import explosion2Url from '../../../assets/png/default/effects/explosion_2.png';
import explosion3Url from '../../../assets/png/default/effects/explosion_3.png';

const TERRAIN_ATLAS_CONFIG = {
  tileSize: 64,
  gap: 10,
  resolution: 2,
  frameInset: 0.25,
} as const;
let sceneryTextures: ReturnType<typeof createSceneryTextures> | undefined;

export async function loadArenaAssets(): Promise<ArenaAssets> {
  const [ships, scenery, effects, healthBars] = await Promise.all([
    loadShips(),
    loadScenery(),
    loadEffects(),
    loadHealthBars(),
  ]);
  return { ...ships, ...scenery, ...effects, ...healthBars };
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
  const sheet = await Assets.load<Texture>({
    src: terrainSheetUrl,
    data: { resolution: TERRAIN_ATLAS_CONFIG.resolution },
  });
  sceneryTextures ??= createSceneryTextures(sheet);
  return sceneryTextures;
}

function createSceneryTextures(sheet: Texture) {
  const land = createTileGrid(sheet, 418, 44, 4, 4);
  const island: IslandTextures = {
    land,
  };
  return {
    water: createTileTexture(sheet, 639, 340, 65),
    island,
    decorations: [
      createTileTexture(sheet, 492, 340),
      createTileTexture(sheet, 122, 340),
    ],
  };
}

function createTileGrid(
  sheet: Texture,
  x: number,
  y: number,
  columns: number,
  rows: number,
) {
  const stride = TERRAIN_ATLAS_CONFIG.tileSize + TERRAIN_ATLAS_CONFIG.gap;
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) =>
      createTileTexture(sheet, x + column * stride, y + row * stride),
    ),
  );
}

function createTileTexture(
  sheet: Texture,
  x: number,
  y: number,
  width: number = TERRAIN_ATLAS_CONFIG.tileSize,
) {
  const { frameInset, tileSize } = TERRAIN_ATLAS_CONFIG;
  return new Texture({
    source: sheet.source,
    frame: new Rectangle(
      x + frameInset,
      y + frameInset,
      width - frameInset * 2,
      tileSize - frameInset * 2,
    ),
  });
}

async function loadEffects() {
  const [projectile, explosion, fire] = await Promise.all([
    Assets.load<Texture>(projectileUrl),
    loadTextures([explosion1Url, explosion2Url, explosion3Url]),
    loadTextures([fire1Url, fire2Url]),
  ]);
  return { projectile, explosion, fire };
}

async function loadHealthBars() {
  const [frame, enemyFill, playerFill] = await loadTextures([
    enemyHealthFrameUrl,
    enemyHealthFillUrl,
    playerHealthFillUrl,
  ]);
  return {
    enemyHealth: { frame, fill: enemyFill },
    playerHealth: { frame, fill: playerFill },
  };
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
