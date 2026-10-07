import { isNetworkScenario, type NetworkScenarioId } from './scenarios';

const NETWORK_STORAGE_KEY = 'pirate-battle.network-scenario';

interface NetworkSettings {
  id: NetworkScenarioId;
  seed: number;
}

export function loadNetworkSettings(): NetworkSettings {
  let settings: NetworkSettings = { id: 'success', seed: 0 };
  try {
    const saved = JSON.parse(
      localStorage.getItem(NETWORK_STORAGE_KEY) ?? 'null',
    );
    if (
      isNetworkScenario(saved?.id) &&
      Number.isSafeInteger(saved.seed) &&
      saved.seed >= 0
    ) {
      settings = { id: saved.id, seed: saved.seed };
    }
  } catch {
    settings = { id: 'success', seed: 0 };
  }
  const params = new URLSearchParams(location.search);
  const id = params.get('network');
  const seed = params.has('seed') ? Number(params.get('seed')) : settings.seed;
  if (isNetworkScenario(id)) {
    settings.id = id;
  }
  if (Number.isSafeInteger(seed) && seed >= 0) {
    settings.seed = seed;
  }
  return settings;
}

export function saveNetworkSettings(settings: NetworkSettings) {
  const url = new URL(location.href);
  url.searchParams.set('network', settings.id);
  url.searchParams.set('seed', String(settings.seed));
  history.replaceState(null, '', url);
  try {
    localStorage.setItem(NETWORK_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    return;
  }
}
