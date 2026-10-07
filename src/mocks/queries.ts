import type { MatchRecord } from '../api/contracts';
import type { GameOptions } from '../game/support/options';

export function getRanking(records: MatchRecord[], configuration: GameOptions) {
  return records
    .filter((record) => matchesConfiguration(record, configuration))
    .sort(compareRanking)
    .map((record, index) => ({ ...record, rank: index + 1 }));
}

export function getMatchHistory(records: MatchRecord[], playerId: string) {
  return records
    .filter((record) => record.player.id === playerId)
    .sort(compareRecentMatches);
}

function matchesConfiguration(record: MatchRecord, configuration: GameOptions) {
  return (
    record.configuration.sessionDuration === configuration.sessionDuration &&
    record.configuration.enemySpawnInterval === configuration.enemySpawnInterval
  );
}

function compareRanking(first: MatchRecord, second: MatchRecord) {
  return (
    second.score - first.score ||
    Date.parse(first.completedAt) - Date.parse(second.completedAt) ||
    first.id.localeCompare(second.id)
  );
}

function compareRecentMatches(first: MatchRecord, second: MatchRecord) {
  return (
    Date.parse(second.completedAt) - Date.parse(first.completedAt) ||
    first.id.localeCompare(second.id)
  );
}
