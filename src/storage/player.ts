import type { PlayerIdentity } from '../api/contracts';

export const PLAYER_STORAGE_KEY = 'pirate-battle.player';

export function loadPlayer(): PlayerIdentity {
  try {
    const saved = localStorage.getItem(PLAYER_STORAGE_KEY);
    const player = saved ? JSON.parse(saved) : undefined;
    if (
      typeof player?.id === 'string' &&
      player.id.trim() &&
      typeof player.name === 'string' &&
      player.name.trim()
    ) {
      return { id: player.id, name: player.name };
    }
  } catch {
    // Create an identity when storage is unavailable or invalid.
  }
  const player = { id: crypto.randomUUID(), name: 'You' };
  try {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
  } catch {
    return player;
  }
  return player;
}
