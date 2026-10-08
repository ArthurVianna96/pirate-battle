import type { Container, Sprite, Texture } from 'pixi.js';
import type { Obstacle } from '../mechanics/collisions';
import type { createEnemy } from './enemies';
import type { EnemyKind, MovingEnemyState } from '../mechanics/combat';
import type { ShooterState } from '../mechanics/shooter';
import type { PlayerState } from '../mechanics/simulation';

export interface ShipTextures {
  healthy: Texture;
  damaged: Texture;
  critical: Texture;
}

export interface HealthBarTextures {
  frame: Texture;
  fill: Texture;
}

export interface IslandTextures {
  sand: Texture;
  grass: Texture;
  shoreline: Texture;
}

export interface ArenaAssets {
  enemyHealth: HealthBarTextures;
  playerHealth: HealthBarTextures;
  playerShip: ShipTextures;
  chaser: ShipTextures;
  shooter: ShipTextures;
  fire: Texture[];
  water: Texture;
  island: IslandTextures;
  decorations: Texture[];
  projectile: Texture;
  explosion: Texture[];
}

export interface ArenaView {
  container: Container;
  ship: Sprite;
  obstacles: Obstacle[];
  projectileTexture: Texture;
  explosionTextures: Texture[];
  playerShipTextures: ShipTextures;
  playerHealthTextures: HealthBarTextures;
  fireTextures: Texture[];
  enemies: EnemyView[];
  size: ArenaSize;
  resize: (width: number, height: number) => void;
  spawnEnemy: (kind: EnemyKind, position: PlayerState) => void;
}

export type EnemyView = {
  renderer: ReturnType<typeof createEnemy>;
} & (
  | { kind: 'chaser'; state: MovingEnemyState }
  | { kind: 'shooter'; state: ShooterState }
);

export interface ArenaSize {
  width: number;
  height: number;
}

export interface PlayerOptions extends ArenaSize {
  texture: Texture;
}

export interface IslandOptions extends ArenaSize {
  texture: IslandTextures;
  decorations: Texture[];
}

export interface EnemyOptions extends ArenaSize {
  healthBar: HealthBarTextures;
  ship: Sprite;
  shipTextures: ShipTextures;
  arena: Container;
  fire: Texture[];
}
