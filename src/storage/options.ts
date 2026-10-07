import {
  DEFAULT_OPTIONS,
  parseOptions,
  type GameOptions,
} from '../game/options';

export const OPTIONS_STORAGE_KEY = 'pirate-battle.options';

export function loadOptions(): GameOptions {
  try {
    const saved = localStorage.getItem(OPTIONS_STORAGE_KEY);
    if (saved) {
      const options = parseOptions(JSON.parse(saved));
      if (options) return options;
    }
  } catch {
    // Missing, inaccessible or malformed storage uses the default options.
  }
  return { ...DEFAULT_OPTIONS };
}

export function saveOptions(options: GameOptions) {
  const validated = parseOptions(options);
  if (!validated) throw new Error('Cannot save invalid options.');
  localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(validated));
}
