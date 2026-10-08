import { Container, Sprite, type Texture } from 'pixi.js';
import type { IslandOptions } from './types';
import { createIslandLayout, ISLAND_CONFIG, type IslandLayout } from './level';

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
  textures: Texture[],
  decorations: Texture[],
) {
  const island = new Container();
  island.position.set(land.bounds.x, land.bounds.y);
  addTerrain(island, land, textures);
  addDecorations(island, land, decorations);
  return island;
}

function addTerrain(
  island: Container,
  { columns, rows }: IslandLayout,
  textures: Texture[],
) {
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const edgeRow = row === 0 ? 0 : row === rows - 1 ? 2 : 1;
      const edgeColumn = column === 0 ? 0 : column === columns - 1 ? 2 : 1;
      const tile = new Sprite(textures[edgeRow * 3 + edgeColumn]);
      tile.position.set(
        column * ISLAND_CONFIG.tileSize,
        row * ISLAND_CONFIG.tileSize,
      );
      island.addChild(tile);
    }
  }
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
