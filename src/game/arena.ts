import { Assets, Container, Sprite, TilingSprite, type Texture } from 'pixi.js';
import playerShipUrl from '../../assets/png/default/ships/ship_1.png';
import waterUrl from '../../assets/png/default/tiles/tile_73.png';
import islandTopLeftUrl from '../../assets/png/default/tiles/tile_1.png';
import islandTopUrl from '../../assets/png/default/tiles/tile_2.png';
import islandTopRightUrl from '../../assets/png/default/tiles/tile_3.png';
import islandLeftUrl from '../../assets/png/default/tiles/tile_17.png';
import islandCenterUrl from '../../assets/png/default/tiles/tile_18.png';
import islandRightUrl from '../../assets/png/default/tiles/tile_19.png';
import islandBottomLeftUrl from '../../assets/png/default/tiles/tile_33.png';
import islandBottomUrl from '../../assets/png/default/tiles/tile_34.png';
import islandBottomRightUrl from '../../assets/png/default/tiles/tile_35.png';
import type { Obstacle } from './collisions';
import projectileUrl from '../../assets/png/default/ship_parts/cannon_ball.png';

const islandLayout = { tileSize: 64, columns: 3, rows: 3 } as const;

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

interface ArenaAssets {
  playerShip: Texture;
  water: Texture;
  island: Texture[];
  projectile: Texture;
}

export async function loadArenaAssets(): Promise<ArenaAssets> {
  const [playerShip, water, island, projectile] = await Promise.all([
    Assets.load<Texture>(playerShipUrl),
    Assets.load<Texture>(waterUrl),
    Promise.all(islandTileUrls.map((url) => Assets.load<Texture>(url))),
    Assets.load<Texture>(projectileUrl),
  ]);

  return { playerShip, water, island, projectile };
}

function createIsland(textures: Texture[]): Container {
  const island = new Container();
  const { tileSize, columns, rows } = islandLayout;

  textures.forEach((texture, index) => {
    const tile = new Sprite(texture);
    tile.position.set(
      (index % columns) * tileSize,
      Math.floor(index / columns) * tileSize,
    );
    island.addChild(tile);
  });

  island.pivot.set((columns * tileSize) / 2, (rows * tileSize) / 2);
  return island;
}

export interface ArenaView {
  container: Container;
  ship: Sprite;
  obstacles: Obstacle[];
  projectileTexture: Texture;
}

export function createArena(
  textures: ArenaAssets,
  width: number,
  height: number,
): ArenaView {
  const arena = new Container();
  const water = new TilingSprite({ texture: textures.water, width, height });
  const island = createIsland(textures.island);
  island.position.set(width / 4, height / 2);
  const islandWidth = islandLayout.columns * islandLayout.tileSize;
  const islandHeight = islandLayout.rows * islandLayout.tileSize;
  const obstacles: Obstacle[] = [
    {
      x: island.x - islandWidth / 2,
      y: island.y - islandHeight / 2,
      width: islandWidth,
      height: islandHeight,
    },
  ];
  const ship = new Sprite({ texture: textures.playerShip, anchor: 0.5 });
  ship.position.set(width / 2, height / 2);
  // The supplied artwork points down; turn its bow toward the top.
  ship.rotation = Math.PI;

  arena.addChild(water, island, ship);
  return {
    container: arena,
    ship,
    obstacles,
    projectileTexture: textures.projectile,
  };
}
