import { delay, HttpResponse } from 'msw';
import type { MatchRecord, PlayerIdentity } from '../api/contracts';
import { HTTP_CONFIG } from '../api/config';
import { DEFAULT_OPTIONS } from '../game/support/options';
import { MATCH_FIXTURES } from './fixtures';
import {
  getScenario,
  type NetworkOperation,
  type NetworkScenarioId,
} from './scenarios';

export const NETWORK_TIMING = {
  slow: 1_500,
  fast: 100,
  variable: [1_200, 100, 600],
  timeout: HTTP_CONFIG.timeout + 1_000,
} as const;

interface ScenarioState {
  id: NetworkScenarioId;
  seed: number;
}

interface RequestContext {
  page?: number;
  alreadyAccepted?: boolean;
}

export function createNetworkScenario(
  initial: ScenarioState = { id: 'success', seed: 0 },
  player: PlayerIdentity = { id: 'demo-player', name: 'Demo Captain' },
  timing: {
    slow: number;
    fast: number;
    variable: readonly number[];
    timeout: number;
  } = NETWORK_TIMING,
) {
  let state = initial;
  let requestCount = 0;
  const listeners = new Set<() => void>();
  const fixtureIds = new Set(MATCH_FIXTURES.map((record) => record.id));
  const extraMatches: MatchRecord[] = Array.from(
    { length: 24 },
    (_, index) => ({
      id: `demo-match-${index + 1}`,
      player,
      score: 24 - index,
      completedAt: `2026-01-02T12:${String(index).padStart(2, '0')}:00.000Z`,
      elapsedSeconds: 60,
      endReason: 'time',
      configuration: { ...DEFAULT_OPTIONS },
    }),
  );

  function select(id: NetworkScenarioId, seed = state.seed) {
    state = { id, seed };
    requestCount = 0;
    listeners.forEach((listener) => listener());
  }

  function list(records: MatchRecord[]) {
    const { data } = getScenario(state.id);
    if (data === 'empty') {
      return records.filter((record) => !fixtureIds.has(record.id));
    }
    if (data === 'many-pages') {
      return [...records, ...extraMatches];
    }
    return records;
  }

  function responseDelay(context: RequestContext, index: number) {
    const { latency } = getScenario(state.id);
    if (latency === 'slow') {
      return timing.slow;
    }
    if (latency === 'out-of-order') {
      return (context.page ?? 1) % 2 === 1 ? timing.slow : timing.fast;
    }
    if (latency === 'variable') {
      return timing.variable[(index + state.seed) % timing.variable.length];
    }
    return 0;
  }

  async function faultResponse(fault: string) {
    if (fault === 'connection') {
      return HttpResponse.error();
    }
    if (fault === 'timeout') {
      await delay(timing.timeout);
      return HttpResponse.json(
        { code: 'TIMEOUT', message: 'Simulated timeout.' },
        { status: 504 },
      );
    }
    const status = fault === 'bad-request' ? 400 : 500;
    return HttpResponse.json(
      { code: 'SIMULATED_FAILURE', message: 'Simulated API failure.' },
      { status },
    );
  }

  async function respond(
    operation: NetworkOperation,
    context: RequestContext,
    success: () => Response,
  ): Promise<Response> {
    const scenario = getScenario(state.id);
    const index = requestCount++;
    if (
      scenario.fault &&
      (!scenario.operation || scenario.operation === operation)
    ) {
      return faultResponse(scenario.fault);
    }
    const latency = responseDelay(context, index);
    const response = success();
    if (
      scenario.acceptedTimeout &&
      operation === 'registration' &&
      !context.alreadyAccepted &&
      response.ok
    ) {
      await delay(timing.timeout);
    } else if (latency > 0) {
      await delay(latency);
    }
    return response;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function getSnapshot() {
    return state;
  }

  return { select, list, respond, subscribe, getSnapshot };
}
