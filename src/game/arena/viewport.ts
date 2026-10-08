import type { Size } from '../mechanics/collisions';

export const VIEWPORT_CONFIG = {
  referenceWidth: 960,
  referenceHeight: 540,
} as const;

export function calculateArenaViewport({ width, height }: Size) {
  const scale = Math.min(
    width / VIEWPORT_CONFIG.referenceWidth,
    height / VIEWPORT_CONFIG.referenceHeight,
  );
  return { scale, width: width / scale, height: height / scale };
}
