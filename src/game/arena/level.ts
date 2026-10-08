import type { Obstacle } from '../mechanics/collisions';

interface Decoration {
  kind: 'palm' | 'rock';
  x: number;
  y: number;
}

export interface IslandLayout {
  bounds: Obstacle;
  columns: number;
  rows: number;
  decorations: readonly Decoration[];
}

export const ISLAND_CONFIG = {
  tileSize: 64,
  grassCoverage: 0.65,
  grassCornerRadius: 24,
  shorelinePadding: 32,
  shorelineTint: 0xc9eadb,
  shorelineOpacity: 1,
} as const;

export function createIslandLayout(
  width: number,
  height: number,
): IslandLayout[] {
  return [
    createLand(width / 4 - 96, height / 2 - 224, 3, 5, [
      { kind: 'palm', x: 0.5, y: 0.3 },
      { kind: 'rock', x: 0.65, y: 0.58 },
      { kind: 'palm', x: 0.38, y: 0.8 },
    ]),
    createLand(width / 2 - 96, height - 92, 4, 3, [
      { kind: 'palm', x: 0.3, y: 0.4 },
      { kind: 'rock', x: 0.7, y: 0.3 },
    ]),
    createLand(width - 64, height - 156, 3, 3, [
      { kind: 'palm', x: 0.3, y: 0.45 },
    ]),
  ];
}

function createLand(
  x: number,
  y: number,
  columns: number,
  rows: number,
  decorations: Decoration[],
): IslandLayout {
  return {
    bounds: {
      x,
      y,
      width: columns * ISLAND_CONFIG.tileSize,
      height: rows * ISLAND_CONFIG.tileSize,
    },
    columns,
    rows,
    decorations,
  };
}
