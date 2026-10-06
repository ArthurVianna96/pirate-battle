import { type Obstacle, type Size } from './collisions';
import { createTargetState, type TargetState } from './combat';
import { updatePlayer, type PlayerState } from './simulation';

export const chaserConfig = {
  speed: 60,
  rotationSpeed: Math.PI / 2,
  stopDistance: 80,
} as const;

export interface ChaserState extends TargetState {
  position: PlayerState;
  shipSize: Size;
}

export function createChaserState(bounds: Obstacle): ChaserState {
  return {
    ...createTargetState({ ...bounds }),
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
  world: { arenaSize: Size; obstacles: readonly Obstacle[] },
  config: {
    speed: number;
    rotationSpeed: number;
    stopDistance: number;
  } = chaserConfig,
) {
  if (chaser.health === 0 || deltaSeconds <= 0) return;

  const steps = Math.max(1, Math.ceil(deltaSeconds / (1 / 60)));
  const stepSeconds = deltaSeconds / steps;
  for (let step = 0; step < steps; step++) {
    const distanceX = player.x - chaser.position.x;
    const distanceY = player.y - chaser.position.y;
    const distance = Math.hypot(distanceX, distanceY);
    if (distance <= config.stopDistance) break;

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
      stepSeconds,
      {
        speed: Math.min(
          config.speed,
          (distance - config.stopDistance) / stepSeconds,
        ),
        rotationSpeed: Math.min(
          config.rotationSpeed,
          Math.abs(turn) / stepSeconds,
        ),
      },
      { ...world, shipSize: chaser.shipSize },
    );
  }

  syncChaserBounds(chaser);
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
