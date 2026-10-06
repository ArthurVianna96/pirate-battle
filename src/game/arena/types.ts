import type { Container, Sprite, Texture } from 'pixi.js';
import type { Obstacle } from '../mechanics/collisions';
import type { createEnemy } from './enemies';
import type { MovingEnemyState } from '../mechanics/combat';
import type { ShooterState } from '../mechanics/shooter';
import type { PlayerState } from '../mechanics/simulation';

export interface ArenaAssets {
  playerShip: Texture;
  water: Texture;
  island: Texture[];
  projectile: Texture;
  explosion: Texture[];
}

export interface ArenaView {
  container: Container;
  ship: Sprite;
  obstacles: Obstacle[];
  projectileTexture: Texture;
  explosionTextures: Texture[];
  enemies: EnemyView[];
  spawnChaser: (position: PlayerState) => void;
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
  texture: Texture[];
}

export interface EnemyOptions extends ArenaSize {
  ship: Sprite;
  arena: Container;
}
