import {
  constrainPlayerToArena,
  getShipBounds,
  overlapsObstacle,
  type Obstacle,
  type Size,
} from './collisions';
import type { MovementWorld, PlayerState } from './simulation';

type Position = Pick<PlayerState, 'x' | 'y'>;

interface ResizeScale {
  x: number;
  y: number;
}

export function createResizeScale(
  previousSize: Size,
  nextSize: Size,
): ResizeScale {
  return {
    x: nextSize.width / previousSize.width,
    y: nextSize.height / previousSize.height,
  };
}

export function resizePosition(position: Position, scale: ResizeScale) {
  position.x *= scale.x;
  position.y *= scale.y;
}

export function relocateShip(
  position: PlayerState,
  previousSize: Size,
  world: MovementWorld,
) {
  resizePosition(position, createResizeScale(previousSize, world.arenaSize));
  constrainPlayerToArena(position, world.shipSize, world.arenaSize);
  if (isValidShipPosition(position, world)) {
    return;
  }

  const destination = findNearestClearPosition(position, world);
  if (destination) {
    Object.assign(position, destination);
  }
}

function findNearestClearPosition(position: PlayerState, world: MovementWorld) {
  const candidates = createRelocationCandidates(position, world);
  candidates.sort(
    (a, b) => distanceFrom(a, position) - distanceFrom(b, position),
  );
  return candidates.find((candidate) => isValidShipPosition(candidate, world));
}

function createRelocationCandidates(
  position: PlayerState,
  world: MovementWorld,
) {
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
  return candidates;
}

function distanceFrom(position: Position, origin: Position) {
  return Math.hypot(position.x - origin.x, position.y - origin.y);
}

function isValidShipPosition(position: PlayerState, world: MovementWorld) {
  const bounds = getShipBounds(position, world.shipSize);
  const overlapsLand = world.obstacles.some((obstacle) =>
    overlapsObstacle(position, world.shipSize, obstacle),
  );
  return isInsideArena(bounds, world.arenaSize) && !overlapsLand;
}

function isInsideArena(bounds: Obstacle, arenaSize: Size) {
  const fitsHorizontally =
    bounds.x >= 0 && bounds.x + bounds.width <= arenaSize.width;
  const fitsVertically =
    bounds.y >= 0 && bounds.y + bounds.height <= arenaSize.height;
  return fitsHorizontally && fitsVertically;
}
