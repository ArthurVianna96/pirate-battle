import type { Obstacle, Size } from './collisions';
import type { MovingEnemyState } from './combat';
import {
  updatePlayer,
  type PlayerState,
  type MovementConfig,
  type MovementWorld,
} from './simulation';

export interface EnemyMovementWorld {
  arenaSize: Size;
  obstacles: readonly Obstacle[];
}

interface EnemyMovementConfig extends MovementConfig {
  stopDistance?: number;
}

export function updateEnemyMovement(
  enemy: MovingEnemyState,
  player: Pick<PlayerState, 'x' | 'y'>,
  deltaSeconds: number,
  world: EnemyMovementWorld,
  config: EnemyMovementConfig,
) {
  if (enemy.health === 0 || deltaSeconds <= 0) return;

  const movementWorld = { ...world, shipSize: enemy.shipSize };
  const steps = Math.max(1, Math.ceil(deltaSeconds / (1 / 60)));
  const stepSeconds = deltaSeconds / steps;
  for (let step = 0; step < steps; step++) {
    moveTowardPlayer(enemy, player, stepSeconds, movementWorld, config);
  }

  syncEnemyBounds(enemy);
}

function moveTowardPlayer(
  enemy: MovingEnemyState,
  player: Pick<PlayerState, 'x' | 'y'>,
  deltaSeconds: number,
  world: MovementWorld,
  config: EnemyMovementConfig,
) {
  const distanceX = player.x - enemy.position.x;
  const distanceY = player.y - enemy.position.y;
  const distance = Math.hypot(distanceX, distanceY);
  if (distance === 0) return;
  const distanceToTravel = Math.max(0, distance - (config.stopDistance ?? 0));

  // Heading zero points up. Normalize the turn to take the shortest route.
  const desiredHeading = Math.atan2(distanceX, -distanceY);
  const headingDifference = desiredHeading - enemy.position.heading;
  const turn = Math.atan2(
    Math.sin(headingDifference),
    Math.cos(headingDifference),
  );
  updatePlayer(
    enemy.position,
    { forward: distanceToTravel > 0, turnLeft: turn < 0, turnRight: turn > 0 },
    deltaSeconds,
    {
      speed: Math.min(config.speed, distanceToTravel / deltaSeconds),
      rotationSpeed: Math.min(
        config.rotationSpeed,
        Math.abs(turn) / deltaSeconds,
      ),
    },
    world,
  );
}

function syncEnemyBounds(enemy: MovingEnemyState) {
  const { position, shipSize, bounds } = enemy;
  const cos = Math.abs(Math.cos(position.heading));
  const sin = Math.abs(Math.sin(position.heading));
  bounds.width = shipSize.width * cos + shipSize.height * sin;
  bounds.height = shipSize.width * sin + shipSize.height * cos;
  bounds.x = position.x - bounds.width / 2;
  bounds.y = position.y - bounds.height / 2;
}
