import { Container, Sprite, type Texture } from 'pixi.js';
import type { IslandOptions, IslandTextures } from './types';
import { createIslandLayout, type IslandLayout } from './level';

export function renderIsland({
  texture,
  decorations,
  width,
  height,
}: IslandOptions) {
  const island = new Container();
  const layout = createIslandLayout(width, height);

  for (const land of layout) {
    island.addChild(createIsland(land, texture, decorations));
  }

  return { island, obstacles: layout.map(({ bounds }) => bounds) };
}

function createIsland(
  land: IslandLayout,
  textures: IslandTextures,
  decorations: Texture[],
) {
  const island = new Container();
  island.position.set(land.bounds.x, land.bounds.y);
  island.addChild(
    createTerrainGrid(textures.land, land.bounds.width, land.bounds.height),
  );
  addDecorations(island, land, decorations);
  return island;
}

function createTerrainGrid(
  textures: Texture[][],
  width: number,
  height: number,
) {
  const terrain = new Container();
  const tileWidth = width / textures[0].length;
  const tileHeight = height / textures.length;
  textures.forEach((row, rowIndex) => {
    row.forEach((texture, columnIndex) => {
      const tile = new Sprite(texture);
      tile.width = tileWidth;
      tile.height = tileHeight;
      tile.position.set(columnIndex * tileWidth, rowIndex * tileHeight);
      terrain.addChild(tile);
    });
  });
  return terrain;
}

function addDecorations(
  island: Container,
  land: IslandLayout,
  textures: Texture[],
) {
  for (const { kind, x, y } of land.decorations) {
    const decoration = new Sprite(textures[kind === 'palm' ? 0 : 1]);
    decoration.anchor.set(0.5);
    decoration.position.set(x * land.bounds.width, y * land.bounds.height);
    island.addChild(decoration);
  }
}
