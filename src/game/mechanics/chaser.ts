import { overlapsObstacle, type Obstacle, type Size } from './collisions';
import {
  createEnemyState,
  type EnemyState,
  type PlayerCombatState,
} from './combat';
import {
  updatePlayer,
  type PlayerState,
  type MovementConfig,
  type MovementWorld,
} from './simulation';

export const chaserConfig = {
  speed: 60,
  rotationSpeed: Math.PI / 2,
  impactDamage: 1,
} as const;

export interface ChaserConfig extends MovementConfig {
  impactDamage: number;
}

interface ChaserWorld {
  arenaSize: Size;
  obstacles: readonly Obstacle[];
}

export interface ChaserState extends EnemyState {
  position: PlayerState;
  shipSize: Size;
}

export function createChaserState(bounds: Obstacle): ChaserState {
  return {
    ...createEnemyState({ ...bounds }),
    position: {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      heading: 0,
    },
    shipSize: { width: bounds.width, height: bounds.height },
  };
}

export function updateChaser(
  chaser: ChaserState,
  player: Pick<PlayerState, 'x' | 'y'>,
  deltaSeconds: number,
  world: ChaserWorld,
  config: ChaserConfig = chaserConfig,
) {
  if (chaser.health === 0 || deltaSeconds <= 0) return;

  const movementWorld = { ...world, shipSize: chaser.shipSize };
  const steps = Math.max(1, Math.ceil(deltaSeconds / (1 / 60)));
  const stepSeconds = deltaSeconds / steps;
  for (let step = 0; step < steps; step++) {
    moveTowardPlayer(chaser, player, stepSeconds, movementWorld, config);
  }

  syncChaserBounds(chaser);
}

function moveTowardPlayer(
  chaser: ChaserState,
  player: Pick<PlayerState, 'x' | 'y'>,
  deltaSeconds: number,
  world: MovementWorld,
  config: ChaserConfig,
) {
  const distanceX = player.x - chaser.position.x;
  const distanceY = player.y - chaser.position.y;
  const distance = Math.hypot(distanceX, distanceY);
  if (distance === 0) return;

  // Heading zero points up. Normalize the turn to take the shortest route.
  const desiredHeading = Math.atan2(distanceX, -distanceY);
  const headingDifference = desiredHeading - chaser.position.heading;
  const turn = Math.atan2(
    Math.sin(headingDifference),
    Math.cos(headingDifference),
  );
  updatePlayer(
    chaser.position,
    { forward: true, turnLeft: turn < 0, turnRight: turn > 0 },
    deltaSeconds,
    {
      speed: Math.min(config.speed, distance / deltaSeconds),
      rotationSpeed: Math.min(
        config.rotationSpeed,
        Math.abs(turn) / deltaSeconds,
      ),
    },
    world,
  );
}

export function resolveChaserImpact(
  chaser: ChaserState,
  player: PlayerCombatState,
  shipSize: Size,
  config: ChaserConfig = chaserConfig,
): boolean {
  if (chaser.health === 0 || player.health === 0) return false;
  if (!overlapsObstacle(player, shipSize, chaser.bounds)) return false;

  player.health = Math.max(0, player.health - config.impactDamage);
  chaser.health = 0;
  return true;
}

function syncChaserBounds(chaser: ChaserState) {
  const { position, shipSize, bounds } = chaser;
  const cos = Math.abs(Math.cos(position.heading));
  const sin = Math.abs(Math.sin(position.heading));
  bounds.width = shipSize.width * cos + shipSize.height * sin;
  bounds.height = shipSize.width * sin + shipSize.height * cos;
  bounds.x = position.x - bounds.width / 2;
  bounds.y = position.y - bounds.height / 2;
}
