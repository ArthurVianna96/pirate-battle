import { combatConfig, type PlayerCombatState } from './combat';
import type { PlayerState } from './simulation';
import { createWeaponState, type WeaponState } from './weapon';

export interface PlayerGameState extends PlayerCombatState {
  weapon: WeaponState;
}

export function createPlayerState(position: PlayerState): PlayerGameState {
  return {
    ...position,
    health: combatConfig.playerHealth,
    maxHealth: combatConfig.playerHealth,
    weapon: createWeaponState(),
  };
}
