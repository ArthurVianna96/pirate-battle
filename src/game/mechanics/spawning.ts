import { overlapsObstacle, type Obstacle, type Size } from './collisions';
import type { EnemyState } from './combat';
import type { MovementWorld, PlayerState } from './simulation';

export const spawnConfig = { interval: 4, minPlayerDistance: 220 } as const;

interface SpawnerState {
  elapsed: number;
}

export function createSpawnerState(): SpawnerState {
  return { elapsed: 0 };
}

export function updateSpawner(
  spawner: SpawnerState,
  deltaSeconds: number,
  interval: number = spawnConfig.interval,
) {
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new Error('Spawn interval must be a positive finite number.');
  }
  spawner.elapsed += deltaSeconds;
  // Tolerate tiny rounding errors when accumulated frames reach the interval.
  const spawnCount = Math.floor((spawner.elapsed + 1e-9) / interval);
  spawner.elapsed = Math.max(0, spawner.elapsed - spawnCount * interval);
  return spawnCount;
}

export function findEnemySpawn(
  player: Pick<PlayerState, 'x' | 'y'>,
  { shipSize, arenaSize, obstacles }: MovementWorld,
  enemies: readonly EnemyState[],
): PlayerState | undefined {
  const occupiedAreas: Obstacle[] = [
    ...obstacles,
    ...enemies.filter((enemy) => enemy.health > 0).map((enemy) => enemy.bounds),
  ];
  const spawnPositions = getSpawnPositions(arenaSize).map((position) => ({
    ...position,
    heading: Math.atan2(player.x - position.x, position.y - player.y),
  }));

  return spawnPositions.find((position) => {
    const distanceFromPlayer = Math.hypot(
      player.x - position.x,
      player.y - position.y,
    );
    const overlapsOccupiedArea = occupiedAreas.some((area) =>
      overlapsObstacle(position, shipSize, area),
    );

    return (
      distanceFromPlayer >= spawnConfig.minPlayerDistance &&
      isInsideArena(position, shipSize, arenaSize) &&
      !overlapsOccupiedArea
    );
  });
}

function getSpawnPositions(arenaSize: Size) {
  return [
    { x: arenaSize.width * 0.75, y: arenaSize.height / 2 },
    { x: arenaSize.width * 0.85, y: arenaSize.height * 0.25 },
    { x: arenaSize.width * 0.85, y: arenaSize.height * 0.8 },
    { x: arenaSize.width * 0.1, y: arenaSize.height * 0.2 },
    { x: arenaSize.width * 0.1, y: arenaSize.height * 0.8 },
  ];
}

function isInsideArena(
  position: Pick<PlayerState, 'x' | 'y'>,
  shipSize: Size,
  arenaSize: Size,
) {
  // Half the diagonal leaves room for the ship to rotate near an edge.
  const padding = Math.hypot(shipSize.width, shipSize.height) / 2;
  return (
    position.x >= padding &&
    position.x <= arenaSize.width - padding &&
    position.y >= padding &&
    position.y <= arenaSize.height - padding
  );
}
