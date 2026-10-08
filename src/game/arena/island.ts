import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { IslandOptions, IslandTextures } from './types';
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
  textures: IslandTextures,
  decorations: Texture[],
) {
  const island = new Container();
  island.position.set(land.bounds.x, land.bounds.y);
  addShoreline(island, land, textures.shoreline);
  addTerrain(island, land, textures.sand);
  addGrass(island, land, textures);
  addDecorations(island, land, decorations);
  return island;
}

function createTerrainPatch(texture: Texture, width: number, height: number) {
  const patch = new Sprite(texture);
  patch.width = width;
  patch.height = height;
  return patch;
}

function addShoreline(
  island: Container,
  { bounds }: IslandLayout,
  texture: Texture,
) {
  const padding = ISLAND_CONFIG.shorelinePadding;
  const shoreline = createTerrainPatch(
    texture,
    bounds.width + padding * 2,
    bounds.height + padding * 2,
  );
  shoreline.position.set(-padding, -padding);
  shoreline.tint = ISLAND_CONFIG.shorelineTint;
  shoreline.alpha = ISLAND_CONFIG.shorelineOpacity;
  island.addChild(shoreline);
}

function addTerrain(
  island: Container,
  { bounds }: IslandLayout,
  texture: Texture,
) {
  island.addChild(createTerrainPatch(texture, bounds.width, bounds.height));
}

function addGrass(
  island: Container,
  { bounds }: IslandLayout,
  textures: IslandTextures,
) {
  const width = bounds.width * ISLAND_CONFIG.grassCoverage;
  const height = bounds.height * ISLAND_CONFIG.grassCoverage;
  const grass = createTerrainPatch(textures.grass, width, height);
  const mask = new Graphics()
    .roundRect(0, 0, width, height, ISLAND_CONFIG.grassCornerRadius)
    .fill(0xffffff);
  const x = (bounds.width - width) / 2;
  const y = (bounds.height - height) / 2;
  grass.position.set(x, y);
  mask.position.set(x, y);
  island.addChild(grass, mask);
  grass.mask = mask;
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
