import type { MovementInput } from './input';

export const movementConfig = { speed: 120 } as const;

export interface PlayerState {
  x: number;
  y: number;
}

export function updatePlayer(
  player: PlayerState,
  input: MovementInput,
  deltaSeconds: number,
  config: { readonly speed: number },
) {
  if (input.forward) player.y -= config.speed * deltaSeconds;
}
