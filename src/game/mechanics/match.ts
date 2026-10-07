export const MATCH_CONFIG = {
  duration: 60,
  minDuration: 60,
  maxDuration: 180,
} as const;

export type MatchEndReason = 'time' | 'death';

export interface MatchState {
  duration: number;
  remainingSeconds: number;
  endReason: MatchEndReason | null;
}

export function createMatchState(
  duration: number = MATCH_CONFIG.duration,
): MatchState {
  if (
    !Number.isFinite(duration) ||
    duration < MATCH_CONFIG.minDuration ||
    duration > MATCH_CONFIG.maxDuration
  ) {
    throw new Error('Match duration must be between 60 and 180 seconds.');
  }
  return { duration, remainingSeconds: duration, endReason: null };
}

/** Returns only the time still available for simulation, including a partial final frame. */
export function advanceMatchClock(
  match: MatchState,
  deltaSeconds: number,
): number {
  if (match.endReason) return 0;
  const activeSeconds = Math.min(
    Math.max(0, deltaSeconds),
    match.remainingSeconds,
  );
  match.remainingSeconds -= activeSeconds;
  if (match.remainingSeconds < 1e-9) match.remainingSeconds = 0;
  return activeSeconds;
}

export function finishMatchIfNeeded(
  match: MatchState,
  playerHealth: number,
): MatchEndReason | null {
  if (match.endReason) return null;
  if (playerHealth <= 0) match.endReason = 'death';
  else if (match.remainingSeconds === 0) match.endReason = 'time';
  return match.endReason;
}
