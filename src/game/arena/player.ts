import { Sprite } from 'pixi.js';
import type { PlayerOptions } from './types';

export const renderPlayer = ({ texture, width, height }: PlayerOptions) => {
  const ship = new Sprite({ texture, anchor: 0.5 });
  ship.position.set(width / 2, height / 2);
  ship.rotation = Math.PI;
  return ship;
};
