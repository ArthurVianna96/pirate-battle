import type { MatchRecord } from '../api/contracts';
import { DEFAULT_OPTIONS } from '../game/support/options';

export const MATCH_FIXTURES: MatchRecord[] = [
  { id: 'fixture-1', name: 'Blackbeard', score: 12 },
  { id: 'fixture-2', name: 'Anne Bonny', score: 9 },
  { id: 'fixture-3', name: 'Mary Read', score: 9 },
  { id: 'fixture-4', name: 'Calico Jack', score: 6 },
  { id: 'fixture-5', name: 'Captain Kidd', score: 4 },
  { id: 'fixture-6', name: 'Grace O’Malley', score: 2 },
].map(({ id, name, score }, index) => ({
  id,
  player: { id: `player-${index + 1}`, name },
  score,
  elapsedSeconds: 60,
  endReason: 'time',
  completedAt: `2026-01-01T12:0${index}:00.000Z`,
  configuration: { ...DEFAULT_OPTIONS },
}));
