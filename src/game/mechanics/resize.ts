import {
  constrainPlayerToArena,
  getShipBounds,
  overlapsObstacle,
  type Size,
} from './collisions';
import type { MovementWorld, PlayerState } from './simulation';

export function relocateShip(
  position: PlayerState,
  previousSize: Size,
  world: MovementWorld,
) {
  position.x *= world.arenaSize.width / previousSize.width;
  position.y *= world.arenaSize.height / previousSize.height;
  constrainPlayerToArena(position, world.shipSize, world.arenaSize);
  if (isClear(position, world)) {
    return;
  }

  const bounds = getShipBounds(position, world.shipSize);
  const halfWidth = bounds.width / 2;
  const halfHeight = bounds.height / 2;
  const candidates = world.obstacles.flatMap((obstacle) => [
    { ...position, x: obstacle.x - halfWidth },
    { ...position, x: obstacle.x + obstacle.width + halfWidth },
    { ...position, y: obstacle.y - halfHeight },
    { ...position, y: obstacle.y + obstacle.height + halfHeight },
  ]);
  candidates.push({
    ...position,
    x: world.arenaSize.width / 2,
    y: world.arenaSize.height / 2,
  });
  candidates.sort(
    (a, b) =>
      Math.hypot(a.x - position.x, a.y - position.y) -
      Math.hypot(b.x - position.x, b.y - position.y),
  );
  const destination = candidates.find((candidate) => isClear(candidate, world));
  if (destination) {
    Object.assign(position, destination);
  }
}

function isClear(position: PlayerState, world: MovementWorld) {
  const bounds = getShipBounds(position, world.shipSize);
  return (
    bounds.x >= 0 &&
    bounds.y >= 0 &&
    bounds.x + bounds.width <= world.arenaSize.width &&
    bounds.y + bounds.height <= world.arenaSize.height &&
    !world.obstacles.some((obstacle) =>
      overlapsObstacle(position, world.shipSize, obstacle),
    )
  );
}
