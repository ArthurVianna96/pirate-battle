import { http, HttpResponse, type DefaultBodyType } from 'msw';
import type {
  ApiErrorResponse,
  PageRequest,
  PaginatedResponse,
  RegisterMatchResponse,
} from '../api/contracts';
import { parseOptions } from '../game/support/options';
import { createMatchStore } from './store';
import { parseMatchRecord } from '../api/validation';
import { parsePage } from './validation';
import { createNetworkScenario } from './network';

function invalidRequest() {
  return HttpResponse.json<ApiErrorResponse>(
    { code: 'INVALID_REQUEST', message: 'Check the request fields.' },
    { status: 400 },
  );
}

function paginate<Item>(
  items: Item[],
  page: PageRequest,
): PaginatedResponse<Item> {
  const start = (page.page - 1) * page.pageSize;
  return {
    ...page,
    items: items.slice(start, start + page.pageSize),
    totalItems: items.length,
  };
}

export function createHandlers(
  store = createMatchStore(),
  network = createNetworkScenario(),
) {
  return [
    http.get('*/api/ranking', ({ request }) => {
      const params = new URL(request.url).searchParams;
      const page = parsePage(params);
      const configuration = parseOptions({
        sessionDuration: Number(params.get('sessionDuration')),
        enemySpawnInterval: Number(params.get('enemySpawnInterval')),
      });
      if (!page || !configuration) {
        return invalidRequest();
      }
      return network.respond('ranking', { page: page.page }, () => {
        const entries = network
          .list(store.list())
          .filter(
            (record) =>
              record.configuration.sessionDuration ===
                configuration.sessionDuration &&
              record.configuration.enemySpawnInterval ===
                configuration.enemySpawnInterval,
          )
          .sort(
            (a, b) =>
              b.score - a.score ||
              Date.parse(a.completedAt) - Date.parse(b.completedAt) ||
              a.id.localeCompare(b.id),
          )
          .map((record, index) => ({ ...record, rank: index + 1 }));
        return HttpResponse.json(paginate(entries, page));
      });
    }),
    http.get('*/api/matches', ({ request }) => {
      const params = new URL(request.url).searchParams;
      const page = parsePage(params);
      const playerId = params.get('playerId');
      if (!page || !playerId?.trim()) {
        return invalidRequest();
      }
      return network.respond('history', { page: page.page }, () => {
        const records = network
          .list(store.list())
          .filter((record) => record.player.id === playerId)
          .sort(
            (a, b) =>
              Date.parse(b.completedAt) - Date.parse(a.completedAt) ||
              a.id.localeCompare(b.id),
          );
        return HttpResponse.json(paginate(records, page));
      });
    }),
    http.post<
      Record<string, string>,
      DefaultBodyType,
      RegisterMatchResponse | ApiErrorResponse
    >('*/api/matches', async ({ request }) => {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return invalidRequest();
      }
      const record = parseMatchRecord(body);
      if (!record) {
        return invalidRequest();
      }
      return network.respond(
        'registration',
        { alreadyAccepted: store.has(record.id) },
        () => {
          try {
            return HttpResponse.json<RegisterMatchResponse>({
              match: store.register(record),
            });
          } catch {
            return HttpResponse.json<ApiErrorResponse>(
              {
                code: 'STORE_UNAVAILABLE',
                message: 'Could not save the match. Try again.',
              },
              { status: 503 },
            );
          }
        },
      );
    }),
  ];
}
