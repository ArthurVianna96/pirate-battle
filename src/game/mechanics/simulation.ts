import type { MovementInput } from './input';

export const movementConfig = { speed: 120, rotationSpeed: Math.PI } as const;

export interface MovementConfig {
  readonly speed: number;
  readonly rotationSpeed: number;
}

export interface PlayerState {
  x: number;
  y: number;
  heading: number;
}

export function updatePlayer(
  player: PlayerState,
  input: MovementInput,
  deltaSeconds: number,
  config: MovementConfig,
) {
  const turn = Number(input.turnRight) - Number(input.turnLeft);
  const angularVelocity = turn * config.rotationSpeed;
  const previousHeading = player.heading;
  player.heading += angularVelocity * deltaSeconds;

  if (!input.forward) return;

  if (angularVelocity === 0) {
    player.x += Math.sin(player.heading) * config.speed * deltaSeconds;
    player.y -= Math.cos(player.heading) * config.speed * deltaSeconds;
  } else {
    const radius = config.speed / angularVelocity;
    player.x += radius * (Math.cos(previousHeading) - Math.cos(player.heading));
    player.y -= radius * (Math.sin(player.heading) - Math.sin(previousHeading));
  }
}
