import type { PlayerState } from './simulation';

export interface Size {
  width: number;
  height: number;
}

export interface Obstacle extends Size {
  x: number;
  y: number;
}

/**
 * Checks the projectile's entire straight path during one simulation update.
 * Checking only its final position could miss an obstacle crossed between frames.
 *
 * A fraction t identifies a point along that path:
 * position(t) = previousPosition + (nextPosition - previousPosition) * t.
 * t = 0 is the previous position; t = 1 is the proposed position for this update.
 * For each axis, the function finds the fractions inside the obstacle's bounds.
 * A hit requires the X and Y intervals to overlap within [0, 1], so both
 * coordinates are inside the bounds at the same point along the path.
 *
 * The bounds expand by projectileRadius to account for the projectile's size.
 * This rectangular expansion is conservative near the obstacle's corners.
 * Axis displacements smaller than 1e-9 are treated as zero to avoid division
 * by tiny floating-point residues when the projectile moves parallel to a side.
 *
 * @param previousPosition - Projectile center before this update's movement.
 * @param nextPosition - Proposed center after movement, before collision removal.
 * @param obstacle - Axis-aligned rectangle; x and y locate its top-left corner.
 * @param projectileRadius - Nonnegative radius, in the same units as positions.
 * @returns Whether the path touches or enters the expanded obstacle bounds.
 *
 * @example
 * // Both endpoints are outside, but the path crosses the obstacle.
 * projectilePathHitsObstacle(
 *   { x: 0, y: 5 }, { x: 10, y: 5 },
 *   { x: 4, y: 4, width: 2, height: 2 }, 0,
 * ); // true
 */
export function projectilePathHitsObstacle(
  previousPosition: { x: number; y: number },
  nextPosition: { x: number; y: number },
  obstacle: Obstacle,
  projectileRadius: number,
): boolean {
  let collisionStartFraction = 0;
  let collisionEndFraction = 1;

  const axisMovements = [
    {
      startCoordinate: previousPosition.x,
      displacement: nextPosition.x - previousPosition.x,
      obstacleMin: obstacle.x - projectileRadius,
      obstacleMax: obstacle.x + obstacle.width + projectileRadius,
    },
    {
      startCoordinate: previousPosition.y,
      displacement: nextPosition.y - previousPosition.y,
      obstacleMin: obstacle.y - projectileRadius,
      obstacleMax: obstacle.y + obstacle.height + projectileRadius,
    },
  ];
  for (const axis of axisMovements) {
    if (Math.abs(axis.displacement) < 1e-9) {
      if (
        axis.startCoordinate < axis.obstacleMin ||
        axis.startCoordinate > axis.obstacleMax
      )
        return false;
      continue;
    }
    const minBoundaryFraction =
      (axis.obstacleMin - axis.startCoordinate) / axis.displacement;
    const maxBoundaryFraction =
      (axis.obstacleMax - axis.startCoordinate) / axis.displacement;
    collisionStartFraction = Math.max(
      collisionStartFraction,
      Math.min(minBoundaryFraction, maxBoundaryFraction),
    );
    collisionEndFraction = Math.min(
      collisionEndFraction,
      Math.max(minBoundaryFraction, maxBoundaryFraction),
    );
    if (collisionStartFraction > collisionEndFraction) return false;
  }
  return true;
}

function shipExtents(player: PlayerState, shipSize: Size) {
  const cos = Math.abs(Math.cos(player.heading));
  const sin = Math.abs(Math.sin(player.heading));
  return {
    halfWidth: (shipSize.width * cos + shipSize.height * sin) / 2,
    halfHeight: (shipSize.width * sin + shipSize.height * cos) / 2,
  };
}

export function getShipBounds(position: PlayerState, shipSize: Size): Obstacle {
  const { halfWidth, halfHeight } = shipExtents(position, shipSize);
  return {
    x: position.x - halfWidth,
    y: position.y - halfHeight,
    width: halfWidth * 2,
    height: halfHeight * 2,
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

export function resolveObstacle(
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
