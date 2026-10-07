import { createMatchStore } from './store';
import { loadMockMatches, saveMockMatches } from './storage';
import { createNetworkScenario } from './network';
import { loadNetworkSettings, saveNetworkSettings } from './preferences';
import { loadPlayer } from '../storage/player';
import type { NetworkScenarioId } from './scenarios';

export const store = createMatchStore(loadMockMatches(), saveMockMatches);
export const networkScenario = createNetworkScenario(
  loadNetworkSettings(),
  loadPlayer(),
);

export function selectNetworkScenario(id: NetworkScenarioId, seed?: number) {
  networkScenario.select(id, seed);
  saveNetworkSettings(networkScenario.getSnapshot());
}

export function resetNetworkState() {
  store.reset();
  selectNetworkScenario('success', 0);
}
