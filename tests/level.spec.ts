import { expect, test } from '@playwright/test';
import { Texture } from 'pixi.js';
import { createIslandLayout } from '../src/game/arena/level';
import { renderIsland } from '../src/game/arena/island';
import { overlapsObstacle } from '../src/game/mechanics/collisions';
import { findEnemySpawn } from '../src/game/mechanics/spawning';
import { SPAWN_CONFIG } from '../src/game/config';

const arena = { width: 960, height: 540 };
const shipSize = { width: 66, height: 113 };

test('terrain sprites and collision bounds share the island layout', () => {
  const layout = createIslandLayout(arena.width, arena.height);
  const terrain = renderIsland({
    ...arena,
    texture: Array.from({ length: 9 }, () => Texture.WHITE),
    decorations: [Texture.WHITE, Texture.WHITE],
  });
  expect(terrain.obstacles).toEqual(layout.map(({ bounds }) => bounds));
  expect(terrain.island.children).toHaveLength(3);
  layout.forEach((land, index) => {
    const rendered = terrain.island.children[index];
    expect(rendered.position.x).toBe(land.bounds.x);
    expect(rendered.position.y).toBe(land.bounds.y);
    expect(rendered.children).toHaveLength(
      land.columns * land.rows + land.decorations.length,
    );
  });
  terrain.island.destroy({ children: true });
});

test('initial ships and the central sailing route remain clear of land', () => {
  const obstacles = createIslandLayout(arena.width, arena.height).map(
    ({ bounds }) => bounds,
  );
  const positions = [
    { x: 480, y: 270, heading: 0 },
    { x: 480, y: 100, heading: 0 },
    { x: 720, y: 400, heading: 0 },
    {
      x: arena.width * SPAWN_CONFIG.initialChaser.x,
      y: arena.height * SPAWN_CONFIG.initialChaser.y,
      heading: -Math.PI / 2,
    },
    {
      x: arena.width * SPAWN_CONFIG.initialShooter.x,
      y: arena.height * SPAWN_CONFIG.initialShooter.y,
      heading: 0,
    },
  ];
  for (const position of positions) {
    expect(
      obstacles.some((obstacle) =>
        overlapsObstacle(position, shipSize, obstacle),
      ),
    ).toBe(false);
  }
  expect(
    findEnemySpawn(positions[0], { arenaSize: arena, shipSize, obstacles }, []),
  ).toBeDefined();
});
