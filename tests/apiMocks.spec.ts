import { expect, test } from '@playwright/test';
import type { MatchRecord } from '../src/api/contracts';

test('ranking paginates with stable ranks and filters configurations', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
  const ranking = await page.evaluate(async () => {
    const query = 'sessionDuration=60&enemySpawnInterval=4&pageSize=2';
    const first = await fetch(`/api/ranking?${query}&page=1`).then((r) =>
      r.json(),
    );
    const second = await fetch(`/api/ranking?${query}&page=2`).then((r) =>
      r.json(),
    );
    const empty = await fetch(
      '/api/ranking?sessionDuration=120&enemySpawnInterval=4',
    ).then((r) => r.json());
    return { first, second, empty };
  });
  expect(ranking.first.totalItems).toBe(6);
  expect(
    ranking.first.items.map((entry: { rank: number }) => entry.rank),
  ).toEqual([1, 2]);
  expect(
    ranking.second.items.map((entry: { rank: number }) => entry.rank),
  ).toEqual([3, 4]);
  expect(ranking.empty.items).toEqual([]);
});

test('registration retries create one ranking and history entry', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
  const record: MatchRecord = {
    id: 'test-match',
    player: { id: 'test-player', name: 'Test Captain' },
    completedAt: '2026-02-01T00:00:00.000Z',
    score: 20,
    elapsedSeconds: 60,
    endReason: 'time',
    configuration: { sessionDuration: 60, enemySpawnInterval: 4 },
  };
  const responses = await page.evaluate(async (match) => {
    const register = () =>
      fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match),
      }).then((r) => r.json());
    const first = await register();
    const retry = await register();
    const history = await fetch('/api/matches?playerId=test-player').then((r) =>
      r.json(),
    );
    const ranking = await fetch(
      '/api/ranking?sessionDuration=60&enemySpawnInterval=4',
    ).then((r) => r.json());
    const invalid = await fetch('/api/matches', { method: 'POST', body: '{}' });
    return { first, retry, history, ranking, invalidStatus: invalid.status };
  }, record);
  expect(responses.first.match).toEqual(record);
  expect(responses.retry).toEqual(responses.first);
  expect(responses.history.items).toEqual([record]);
  expect(responses.history.totalItems).toBe(1);
  expect(responses.ranking.totalItems).toBe(7);
  expect(responses.ranking.items[0].id).toBe(record.id);
  expect(responses.invalidStatus).toBe(400);
});
