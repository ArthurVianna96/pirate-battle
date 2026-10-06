import {
  updatePlayer,
  type PlayerState,
  type MovementConfig,
} from './simulation';
import type { MovementInput } from './input';

interface Size {
  width: number;
  height: number;
}

export interface Obstacle extends Size {
  x: number;
  y: number;
}

function shipExtents(player: PlayerState, shipSize: Size) {
  const cos = Math.abs(Math.cos(player.heading));
  const sin = Math.abs(Math.sin(player.heading));
  return {
    halfWidth: (shipSize.width * cos + shipSize.height * sin) / 2,
    halfHeight: (shipSize.width * sin + shipSize.height * cos) / 2,
  };
}

export function overlapsObstacle(
  player: PlayerState,
  shipSize: Size,
  obstacle: Obstacle,
): boolean {
  const { halfWidth, halfHeight } = shipExtents(player, shipSize);
  return (
    player.x + halfWidth > obstacle.x &&
    player.x - halfWidth < obstacle.x + obstacle.width &&
    player.y + halfHeight > obstacle.y &&
    player.y - halfHeight < obstacle.y + obstacle.height
  );
}

function resolveObstacle(
  player: PlayerState,
  shipSize: Size,
  obstacle: Obstacle,
) {
  if (!overlapsObstacle(player, shipSize, obstacle)) return;
  const { halfWidth, halfHeight } = shipExtents(player, shipSize);
  const corrections = [
    { x: obstacle.x - (player.x + halfWidth), y: 0 },
    { x: obstacle.x + obstacle.width - (player.x - halfWidth), y: 0 },
    { x: 0, y: obstacle.y - (player.y + halfHeight) },
    { x: 0, y: obstacle.y + obstacle.height - (player.y - halfHeight) },
  ];
  const correction = corrections.reduce((closest, candidate) =>
    Math.abs(candidate.x) + Math.abs(candidate.y) <
    Math.abs(closest.x) + Math.abs(closest.y)
      ? candidate
      : closest,
  );
  player.x += correction.x;
  player.y += correction.y;
}

export function advancePlayer(
  player: PlayerState,
  input: MovementInput,
  deltaSeconds: number,
  config: MovementConfig,
  world: { shipSize: Size; arenaSize: Size; obstacles: readonly Obstacle[] },
) {
  // Small steps prevent a slow frame from jumping through an island.
  const steps = Math.max(1, Math.ceil(deltaSeconds / (1 / 60)));
  const stepSeconds = deltaSeconds / steps;
  for (let step = 0; step < steps; step++) {
    updatePlayer(player, input, stepSeconds, config);
    constrainPlayerToArena(player, world.shipSize, world.arenaSize);
    world.obstacles.forEach((obstacle) =>
      resolveObstacle(player, world.shipSize, obstacle),
    );
  }
}

export function constrainPlayerToArena(
  player: PlayerState,
  shipSize: Size,
  arenaSize: Size,
) {
  const { halfWidth, halfHeight } = shipExtents(player, shipSize);

  player.x = Math.max(
    halfWidth,
    Math.min(arenaSize.width - halfWidth, player.x),
  );
  player.y = Math.max(
    halfHeight,
    Math.min(arenaSize.height - halfHeight, player.y),
  );
}
