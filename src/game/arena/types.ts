import type { Container, Sprite, Texture } from 'pixi.js';
import type { Obstacle } from '../collisions';
import type { TargetState } from '../target';
import type { createTargetRenderer } from '../targetRenderer';

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
  target: TargetState;
  targetRenderer: ReturnType<typeof createTargetRenderer>;
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

export interface TargetOptions extends ArenaSize {
  ship: Sprite;
  arena: Container;
}
