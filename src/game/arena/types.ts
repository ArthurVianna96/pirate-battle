import type { Container, Sprite, Texture } from 'pixi.js';
import type { Obstacle } from '../mechanics/collisions';
import type { createEnemy } from './enemies';
import type { ChaserState } from '../mechanics/chaser';

export interface ArenaAssets {
  playerShip: Texture;
  water: Texture;
  island: Texture[];
  projectile: Texture;
}

export interface ArenaView {
  container: Container;
  ship: Sprite;
  obstacles: Obstacle[];
  projectileTexture: Texture;
  chaser: ChaserState;
  chaserRenderer: ReturnType<typeof createEnemy>;
}

export interface ArenaSize {
  width: number;
  height: number;
}

export interface ShipOptions extends ArenaSize {
  texture: Texture;
}

export interface IslandOptions extends ArenaSize {
  texture: Texture[];
}

export interface EnemyOptions extends ArenaSize {
  ship: Sprite;
  arena: Container;
}
