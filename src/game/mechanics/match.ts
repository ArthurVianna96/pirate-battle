import { MATCH_CONFIG } from '../config';

export type MatchEndReason = 'time' | 'death';

export interface MatchResult {
  score: number;
  elapsedSeconds: number;
  endReason: MatchEndReason;
}

export interface MatchState {
  duration: number;
  remainingSeconds: number;
  endReason: MatchEndReason | null;
  paused: boolean;
}

export function createMatchState(
  duration: number = MATCH_CONFIG.duration,
): MatchState {
  if (
    !Number.isFinite(duration) ||
    duration < MATCH_CONFIG.minDuration ||
    duration > MATCH_CONFIG.maxDuration
  ) {
    throw new Error(
      `Match duration must be between ${MATCH_CONFIG.minDuration} and ${MATCH_CONFIG.maxDuration} seconds.`,
    );
  }
  return {
    duration,
    remainingSeconds: duration,
    endReason: null,
    paused: false,
  };
}

export function createMatchResult(
  match: MatchState,
  score: number,
): MatchResult {
  if (!match.endReason) {
    throw new Error('Only completed matches have a result.');
  }
  return {
    score,
    elapsedSeconds: match.duration - match.remainingSeconds,
    endReason: match.endReason,
  };
}

export function pauseMatch(match: MatchState): boolean {
  if (match.endReason || match.paused) {
    return false;
  }
  match.paused = true;
  return true;
}

export function resumeMatch(match: MatchState): boolean {
  if (match.endReason || !match.paused) {
    return false;
  }
  match.paused = false;
  return true;
}

/** Returns only the time still available for simulation, including a partial final frame. */
export function advanceMatchClock(
  match: MatchState,
  deltaSeconds: number,
): number {
  if (match.endReason || match.paused) {
    return 0;
  }
  const activeSeconds = Math.min(
    Math.max(0, deltaSeconds),
    match.remainingSeconds,
  );
  match.remainingSeconds -= activeSeconds;
  if (match.remainingSeconds < 1e-9) {
    match.remainingSeconds = 0;
  }
  return activeSeconds;
}

export function finishMatchIfNeeded(
  match: MatchState,
  playerHealth: number,
): MatchEndReason | null {
  if (match.endReason) {
    return null;
  }
  if (playerHealth <= 0) {
    match.endReason = 'death';
  } else if (match.remainingSeconds === 0) {
    match.endReason = 'time';
  }
  return match.endReason;
}
