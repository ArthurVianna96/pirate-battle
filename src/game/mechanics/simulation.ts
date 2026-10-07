import {
  constrainPlayerToArena,
  resolveObstacle,
  type Obstacle,
  type Size,
} from './collisions';
import type { MovementInput } from './input';

export const MOVEMENT_CONFIG = { speed: 120, rotationSpeed: Math.PI } as const;

export interface MovementConfig {
  readonly speed: number;
  readonly rotationSpeed: number;
}

export interface PlayerState {
  x: number;
  y: number;
  heading: number;
}

export interface MovementWorld {
  shipSize: Size;
  arenaSize: Size;
  obstacles: readonly Obstacle[];
}

export function applyPlayerMovement(
  player: PlayerState,
  input: MovementInput,
  deltaSeconds: number,
  config: MovementConfig,
) {
  const turn = Number(input.turnRight) - Number(input.turnLeft);
  const angularVelocity = turn * config.rotationSpeed;
  const previousHeading = player.heading;
  player.heading += angularVelocity * deltaSeconds;

  if (!input.forward) {
    return;
  }

  if (angularVelocity === 0) {
    player.x += Math.sin(player.heading) * config.speed * deltaSeconds;
    player.y -= Math.cos(player.heading) * config.speed * deltaSeconds;
  } else {
    const radius = config.speed / angularVelocity;
    player.x += radius * (Math.cos(previousHeading) - Math.cos(player.heading));
    player.y -= radius * (Math.sin(player.heading) - Math.sin(previousHeading));
  }
}

export function updatePlayer(
  player: PlayerState,
  input: MovementInput,
  deltaSeconds: number,
  config: MovementConfig,
  world: MovementWorld,
) {
  // Small steps prevent a slow frame from jumping through an island.
  const steps = Math.max(1, Math.ceil(deltaSeconds / (1 / 60)));
  const stepSeconds = deltaSeconds / steps;
  for (let step = 0; step < steps; step++) {
    applyPlayerMovement(player, input, stepSeconds, config);
    constrainPlayerToArena(player, world.shipSize, world.arenaSize);
    world.obstacles.forEach((obstacle) =>
      resolveObstacle(player, world.shipSize, obstacle),
    );
  }
}
