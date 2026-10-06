import type { PlayerState } from './simulation';

interface Size {
  width: number;
  height: number;
}

export function constrainPlayerToArena(
  player: PlayerState,
  shipSize: Size,
  arenaSize: Size,
) {
  const cos = Math.abs(Math.cos(player.heading));
  const sin = Math.abs(Math.sin(player.heading));
  const halfWidth = (shipSize.width * cos + shipSize.height * sin) / 2;
  const halfHeight = (shipSize.width * sin + shipSize.height * cos) / 2;

  player.x = Math.max(
    halfWidth,
    Math.min(arenaSize.width - halfWidth, player.x),
  );
  player.y = Math.max(
    halfHeight,
    Math.min(arenaSize.height - halfHeight, player.y),
  );
}
