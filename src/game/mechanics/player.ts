import { COMBAT_CONFIG } from '../config';
import { type PlayerCombatState } from './combat';
import type { PlayerState } from './simulation';
import { createWeaponState, type WeaponState } from './weapon';

export interface PlayerGameState extends PlayerCombatState {
  weapon: WeaponState;
}

export function createPlayerState(position: PlayerState): PlayerGameState {
  return {
    ...position,
    health: COMBAT_CONFIG.playerHealth,
    maxHealth: COMBAT_CONFIG.playerHealth,
    weapon: createWeaponState(),
  };
}
