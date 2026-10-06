import { Container, Sprite, type Texture } from 'pixi.js';
import type { Obstacle } from '../mechanics/collisions';
import type { IslandOptions } from './types';

const ISLAND_LAYOUT = { tileSize: 64, columns: 3, rows: 3 } as const;

function createIsland(textures: Texture[]): Container {
  const island = new Container();
  const { tileSize, columns, rows } = ISLAND_LAYOUT;

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

export const renderIsland = ({ texture, width, height }: IslandOptions) => {
  const island = createIsland(texture);
  island.position.set(width / 4, height / 2);

  const islandWidth = ISLAND_LAYOUT.columns * ISLAND_LAYOUT.tileSize;
  const islandHeight = ISLAND_LAYOUT.rows * ISLAND_LAYOUT.tileSize;
  const obstacles: Obstacle[] = [
    {
      x: island.x - islandWidth / 2,
      y: island.y - islandHeight / 2,
      width: islandWidth,
      height: islandHeight,
    },
  ];

  return { island, obstacles };
};
